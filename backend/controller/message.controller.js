import mongoose from "mongoose";
import { validId } from "../utils/validation.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import User from "../models/user.model.js";
import { reactionEmoji } from '../utils/emoji.js';

// mesaj gönderme fonksiyonu
export const sendMessage = async (req, res) => {
    try {
        const { id: receiverId } = req.params; // url deki :id yi alıp receiverId ye ata
        const { message } = req.body; // request body den mesajı al
        const senderId = req.userId; // protectRoute middleware den gelen userId (giriş yapan kullanıcı)

        if (typeof message !== "string" || message.trim() === "") {
            return res.status(400).json({ error: "Message content cannot be empty" });
        }
        if (message.length > 2000) {
            return res.status(400).json({ error: "Message cannot exceed 2000 characters" });
        }

        if (receiverId === senderId) return res.status(400).json({ error: "Cannot message yourself" });
        if (!await User.exists({ _id: receiverId })) return res.status(404).json({ error: "User not found" });
        const sender = await User.findById(senderId); //senderId ile user collectionından kullanıcı bul
        const isFriend = sender.friends.includes(receiverId); //senderId ve receiverId yi içeren bir arkadaş mı kontrol et

        let conversation = await Conversation.findOne( //conversations collectionında senderId ve receiverId yi içeren konuşmayı bul
            { participants: { $all: [senderId, receiverId] } } //$all operatörü ile her iki kullanıcıyı da içeren belgeyi bul,sırası önemli değil
        );

        if (!conversation) { // konuşma yoksa yeni konuşma oluştur
            conversation = await Conversation.findOneAndUpdate({ pairKey: [senderId, receiverId].sort().join(":") }, { $setOnInsert: {
                pairKey: [senderId, receiverId].sort().join(":"),
                participants: [senderId, receiverId],
                messages: [],
                status: isFriend ? "active" : "pending" // Friendship determines the initial request state.
            } }, { upsert: true, new: true });
        }

        //eğer conversation varsa ve status pending ise
        else if (conversation.status === "pending") {
            // Eğer arkadaştalarsa otomatik aktif yap
            if (isFriend) {
                conversation.status = "active";
            } else {
                // Sadece karşı taraf (mesaj isteği atılan kişi) cevap verirse aktife dönsün
                const lastMessageId = conversation.messages[conversation.messages.length - 1];

                if (lastMessageId) {
                    const lastMessage = await Message.findById(lastMessageId);
                    // Eğer şu anki gönderen (senderId), son mesajı atan kişi değilse (yani alıcı cevap veriyorsa)
                    if (lastMessage && lastMessage.senderId.toString() !== senderId.toString()) {
                        conversation.status = "active";
                    }
                }
            }
        }

        const newMessage = new Message({ // message modeline uygun messages collectionına yeni mesaj
            senderId: senderId,
            receiverId: receiverId,
            message: message.trim(),
        });

        await newMessage.save();
        // Atomically keep the newest preview even when message writes finish out of order.
        // A stale pending request must never overwrite an accepted conversation's status.
        conversation = await Conversation.findByIdAndUpdate(conversation._id, {
            $push: { messages: { $each: [newMessage._id], $sort: -1, $slice: 1 } },
            ...(conversation.status === "active" ? { $set: { status: "active" } } : {})
        }, { new: true });

        // SOCKET.IO - Real-time mesaj gönderimi - alıcı online ise anında ilet bu dbye kaydedildikten sonra anlık olarak websocket ile gönder
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            // Gönderenin bilgisi de iletiliyor: alıcıda henüz o sohbet açılmamışsa
            // arayüz kutucuğu kendiliğinden oluşturabilsin diye.
            io.to(receiverSocketId).emit("newMessage", {
                ...newMessage.toObject(),
                sender: {
                    _id: sender._id,
                    fullName: sender.fullName,
                    username: sender.username,
                    profilePic: sender.profilePic
                },
                conversationId: conversation._id,
                conversationStatus: conversation.status
            });
        }

        // Return the saved message as JSON
        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }

};

// belirli bir kullanıcıyla olan mesajları al
export const getMessage = async (req, res) => {
    try {
        const peerId = req.params.id;
        const userId = req.userId;
        const { before } = req.query;
        const limit = req.query.limit === undefined ? 50 : Number(req.query.limit);
        if ((before !== undefined && !validId(before)) || !Number.isInteger(limit) || limit < 1 || limit > 50) return res.status(400).json({ error: "Invalid message cursor or limit" });
        const filter = {
            $or: [{ senderId: userId, receiverId: peerId }, { senderId: peerId, receiverId: userId }],
            clearedBy: { $ne: userId },
            ...(before ? { _id: { $lt: before } } : {})
        };
        const messages = await Message.find(filter).sort({ _id: -1 }).limit(limit + 1).lean();
        res.setHeader("X-Has-More", String(messages.length > limit));
        res.status(200).json(messages.slice(0, limit).reverse());
    } catch { res.status(500).json({ error: "Internal Server Error" }); }
};

// sohbeti temizleme fonksiyonu
export const clearConversation = async (req, res) => {
    try {
        const { id: userToChatId } = req.params; // url deki :id yi alıp userToChatId ye ata
        const senderId = req.userId; // protectRoute middleware den gelen userId (giriş yapan kullanıcı)

        const conversation = await Conversation.findOne({ // her iki kullanıcıyı da içeren konuşmayı bul
            participants: { $all: [senderId, userToChatId] }
        });

        if (!conversation) { //conversation yoksa temizlenecek bir şey yok
            return res.status(404).json({ error: "Conversation not found" });
        }

        const pair = { $or: [{ senderId, receiverId: userToChatId }, { senderId: userToChatId, receiverId: senderId }] };
        // Use the same ID ordering as history pagination; later arrivals stay visible.
        const last = await Message.findOne(pair).sort({ _id: -1 }).select('_id').lean();
        const clearedThrough = last?._id?.toString() || conversation.messages.map(String).sort().at(-1) || null;
        let deletedCount = 0;
        if (clearedThrough) {
            const scope = { ...pair, _id: { $lte: clearedThrough } };
            const result = await Message.updateMany({ ...scope, clearedBy: { $ne: senderId } }, { $addToSet: { clearedBy: senderId } });
            deletedCount = result.modifiedCount;
            // Pending and accepted conversations both preserve the other user's history.
            await Message.deleteMany({ ...scope, clearedBy: { $all: conversation.participants } });
            io.to(`user:${senderId}`).emit('conversationCleared', { peerId: userToChatId, clearedThrough });
        }

        res.status(200).json({
            message: "Conversation cleared",
            deletedCount,
            clearedThrough
        });
    }
    catch (error) {
        console.error("Error clearing conversation:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// mesaj düzenleme fonksiyonu
export const editMessage = async (req, res) => {
    try {
        const { id: messageId } = req.params; //adress çubuğundaki :id yi alıp messageId ye ata
        const { newMessage } = req.body; // request body den yeni mesajı al, frontendden düzenlenen mesaj
        const userId = req.userId; //protectRoute middleware den gelen userId

        const message = await Message.findById(messageId); //messages collectionından messageId ile mesajı bul,hangi mesaj düzenlenecekse

        if (!message) { // gelen id ile ilgili mesaj bulunamazsa 
            return res.status(404).json({ error: "Message not found" });
        }

        if (message.senderId.toString() !== userId) { //giriş yapan kullanıcı mesajın sahibi değilse
            return res.status(403).json({ error: "Forbidden. You can only edit your own messages." });
        }

        if (message.isDeleted) { // silinmiş mesaj düzenlenip geri getirilemez
            return res.status(400).json({ error: "A deleted message cannot be edited" });
        }

        if (typeof newMessage !== "string" || newMessage.trim() === "") { //yeni mesaj boşsa
            return res.status(400).json({ error: "Message content cannot be empty" });
        }
        if (newMessage.length > 2000) {
            return res.status(400).json({ error: "Message cannot exceed 2000 characters" });
        }

        const updatedMessage = await Message.findOneAndUpdate(
            { _id: messageId, senderId: userId, isDeleted: { $ne: true } },
            { $set: { message: newMessage.trim(), isEdited: true, editedAt: new Date() } },
            { new: true }
        );
        if (!updatedMessage) return res.status(400).json({ error: "A deleted message cannot be edited" });

        // SOCKET.IO - Real-time mesaj düzenleme bildirimi - alıcı online ise anında ilet bu dbye kaydedildikten sonra anlık olarak websocket ile gönder
        const receiversocketId = getReceiverSocketId(message.receiverId);
        if (receiversocketId) {
            io.to(receiversocketId).emit("messageEdited", { // messageEdited eventini alıcıya emit et, bu nesneyi yolla
                messageId: message._id,
                newMessage: updatedMessage.message,
                isEdited: updatedMessage.isEdited,
                editedAt: updatedMessage.editedAt
            });
        }

        res.status(200).json({//düzenlenen mesajı dön
            message: "Message edited successfully",
            updatedMessage
        });


    } catch (error) {
        console.error("Error editing message:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};







// ═══════════════════════════════════════════════════════════════
// MESAJ SİLME
// Route: DELETE /api/messages/:id
// Mesaj kaydı korunur, içeriği gizlenir (WhatsApp/Discord davranışı):
// böylece sohbet akışındaki sırası bozulmaz ve karşı taraf silindiğini görür.
// ═══════════════════════════════════════════════════════════════
export const deleteMessage = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const userId = req.userId;

        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return res.status(400).json({ error: "Invalid message id" });
        }

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }
        // Sadece mesajı gönderen silebilir
        if (message.senderId.toString() !== userId) {
            return res.status(403).json({ error: "Forbidden. You can only delete your own messages." });
        }
        const deletedMessage = await Message.findOneAndUpdate(
            { _id: messageId, senderId: userId },
            { $set: { isDeleted: true, message: "This message was deleted" } },
            { new: true }
        );
        if (!deletedMessage) return res.status(404).json({ error: "Message not found" });
        io.to(`user:${message.senderId}`).to(`user:${message.receiverId}`)
            .emit("messageDeleted", { messageId: message._id });

        res.status(200).json({
            message: "Message deleted successfully",
            deletedMessage
        });

    } catch (error) {
        console.error("Error deleting message:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// ═══════════════════════════════════════════════════════════════
// OKUNMAMIŞ MESAJ SAYILARI
// Route: GET /api/messages/unread/counts
// Her gönderen için kaç okunmamış mesaj olduğunu döner:
//   { "<userId>": 3, "<userId2>": 1 }
// Kenar çubuğundaki rozetler bu veriyle çiziliyor.
// ═══════════════════════════════════════════════════════════════
export const getUnreadCounts = async (req, res) => {
    try {
        const userId = req.userId;

        const counts = await Message.aggregate([
            {
                $match: {
                    receiverId: new mongoose.Types.ObjectId(userId),
                    isRead: false,
                    isDeleted: { $ne: true },
                    // Kullanıcının temizlediği mesajlar okunmamış sayılmaz
                    clearedBy: { $ne: new mongoose.Types.ObjectId(userId) }
                }
            },
            {
                $group: {
                    _id: "$senderId",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Diziyi arayüzün doğrudan kullanabileceği nesneye çevir
        const result = {};
        for (const row of counts) {
            result[row._id.toString()] = row.count;
        }

        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching unread counts:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// ═══════════════════════════════════════════════════════════════
// MESAJA EMOJİ TEPKİSİ
// Route: POST /api/messages/react/:id   body: { emoji }
// Aynı emoji tekrar gönderilirse tepki kaldırılır (toggle davranışı).
// Her kullanıcının bir mesajda yalnızca bir tepkisi olur.
// ═══════════════════════════════════════════════════════════════
export const reactToMessage = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const emoji = reactionEmoji(req.body?.emoji);
        const userId = req.userId;

        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return res.status(400).json({ error: "Invalid message id" });
        }
        if (!emoji) {
            return res.status(400).json({ error: "Unsupported reaction" });
        }

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }
        if (message.isDeleted) {
            return res.status(400).json({ error: "Cannot react to a deleted message" });
        }

        // Tepki yalnızca sohbetin taraflarından gelebilir
        const isParticipant =
            message.senderId.toString() === userId ||
            message.receiverId.toString() === userId;
        if (!isParticipant) {
            return res.status(403).json({ error: "Forbidden. You are not part of this conversation." });
        }

        const participant = new mongoose.Types.ObjectId(userId);
        const reactions = { $ifNull: ['$reactions', []] };
        const sameUser = { $eq: ['$$reaction.userId', participant] };
        const others = { $filter: { input: reactions, as: 'reaction', cond: { $not: [sameUser] } } };
        const alreadySelected = { $anyElementTrue: [{ $map: { input: reactions, as: 'reaction',
            in: { $and: [sameUser, { $eq: ['$$reaction.emoji', emoji] }] } } }] };
        const updated = await Message.findOneAndUpdate({ _id: messageId, isDeleted: { $ne: true },
            $or: [{ senderId: participant }, { receiverId: participant }] }, [{ $set: {
            reactions: { $cond: [alreadySelected, others, { $concatArrays: [others, [{ userId: participant, emoji }]] }] },
            reactionVersion: { $add: [{ $ifNull: ['$reactionVersion', 0] }, 1] },
        } }], { new: true });
        if (!updated) return res.status(400).json({ error: 'Message is no longer available' });

        io.to(`user:${message.senderId}`).to(`user:${message.receiverId}`).emit('messageReaction', {
            messageId: message._id, reactions: updated.reactions, reactionVersion: updated.reactionVersion,
        });

        res.status(200).json({
            message: "Reaction updated",
            reactions: updated.reactions,
            reactionVersion: updated.reactionVersion
        });
    } catch (error) {
        console.error("Error reacting to message:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
