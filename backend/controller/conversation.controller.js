import mongoose from "mongoose";
import { io } from "../socket/socket.js";
import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";

const listConversations = async (userId, status) => {
    // Aggregations do not apply Mongoose's query casting.
    const participant = new mongoose.Types.ObjectId(userId);
    const conversations = await Conversation.aggregate([
        { $match: { participants: participant, ...(status ? { status } : {}) } },
        { $sort: { updatedAt: -1 } },
        // Resolve previews in MongoDB instead of one populate query per conversation.
        // Legacy conversations can contain multiple message references.
        { $lookup: {
            from: Message.collection.name,
            localField: 'messages', foreignField: '_id',
            pipeline: [
                { $match: { clearedBy: { $ne: participant } } },
                { $sort: { _id: -1 } },
                { $limit: 1 },
            ],
            as: 'messages',
        } },
    ]);
    return Conversation.populate(conversations, { path: 'participants', select: 'fullName username profilePic friendCode' });
};

export const getConversations = async (req, res) => {
    try {
        res.status(200).json(await listConversations(req.userId));
    } catch {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const getConversationsByStatus = async (req, res) => {
    try {
        res.status(200).json(await listConversations(req.userId, req.params.status));
    } catch {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const acceptConversation = async (req, res) => {

    try {
        const { id: conversationId } = req.params;
        const userId = req.userId;

        //Yazışmayı bul (Kullanıcının katılımcı olduğundan emin ol)
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: userId
        });

        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        if (conversation.status === "pending") {
            const first = await Message.findOne({ $or: [
                { senderId: conversation.participants[0], receiverId: conversation.participants[1] },
                { senderId: conversation.participants[1], receiverId: conversation.participants[0] }
            ] }).sort({ _id: 1 });
            if (!first || first.receiverId.toString() !== userId) return res.status(403).json({ error: "Only the receiver can accept a message request" });
        }
        //kilidi aç durumu aktif yap
        conversation.status = "active";
        await conversation.save();
        for (const participant of conversation.participants) io.to(`user:${participant}`).emit("conversationAccepted", { conversationId: conversation._id });

        //güncel hali geri dön
        res.status(200).json(conversation);

    } catch (error) {
        console.error("Error accepting conversation:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
