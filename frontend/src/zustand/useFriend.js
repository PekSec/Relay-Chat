import { create } from "zustand";
import useConversation from './useConversation.js';

// Arkadaşlık Sistemi Global State Yönetimi (Zustand Store)
// Bu store, arkadaşlık sistemiyle ilgili tüm verileri merkezi olarak tutar.
// Tüm componentler ve hook'lar bu store'a erişerek veri okur/yazar.
// Zustand'ın avantajı: Redux'a göre çok daha az boilerplate kod, direkt fonksiyon çağrısı ile state güncelleme.

const useFriendStore = create((set, get) => ({
    friendListVersion: 0,
    invalidateFriendLists: () => set(state => ({ friendListVersion: state.friendListVersion + 1 })),
    applyFriendList: (key, items, version) => {
        if (get().friendListVersion !== version) return false;
        set({ [key]: items });
        return true;
    },
    // ═══════════ STATE ═══════════
    friends: [],                  // Mevcut arkadaş listesi (kabul edilmiş arkadaşlıklar)
    incomingFriendRequests: [],   // Sana gelen beklemedeki arkadaşlık istekleri
    sentFriendRequests: [],       // Senin gönderdiğin beklemedeki arkadaşlık istekleri
    messageRequests: [],          // Arkadaş olmayan birinden gelen mesaj istekleri (pending conversation'lar)

    // ═══════════ ARKADAŞ LİSTESİ ACTIONS ═══════════

    // Tüm arkadaş listesini ayarla (sayfa yüklendiğinde useGetFriends hook'u çağırır)
    setFriends: (friends) => set({ friends }), //set({friends:friends}) ile aynı

    // spread operator ile mevcut listeye yeni arkadaşı ekler: [...eskiListe, yeniArkadaş]
    addFriend: (friend) => set((state) => ({
        friendListVersion: state.friendListVersion + 1,
        friends: [...state.friends.filter(item => item._id !== friend._id), friend]
    })),

    // Arkadaşı listeden çıkar (useRemoveFriend hook'u çağırır)
    removeFriend: (friendId) => set((state) => ({
        friendListVersion: state.friendListVersion + 1,
        friends: state.friends.filter(f => f._id !== friendId) //filter dizide yazılan özelliği karşılayanlar olan yeni dizi döner
    })),

    // ═══════════ GELEN İSTEKLER ACTIONS ═══════════

    // Tüm gelen istekleri ayarla (useGetFriendRequests hook'u çağırır)
    setIncomingFriendRequests: (requests) => set({ incomingFriendRequests: requests }),

    // Yeni gelen istek ekle (socket.io üzerinden gerçek zamanlı bildirim geldiğinde)
    addIncomingFriendRequest: (request) => set((state) => ({
        friendListVersion: state.friendListVersion + 1,
        incomingFriendRequests: [...state.incomingFriendRequests.filter(item => item._id !== request._id), request]
    })),

    // Gelen isteği listeden kaldır (kabul veya red edildiğinde)
    removeIncomingFriendRequest: (requestId) => set((state) => ({
        friendListVersion: state.friendListVersion + 1,
        incomingFriendRequests: state.incomingFriendRequests.filter(r => r._id !== requestId)
    })),

    // ═══════════ GÖNDERİLEN İSTEKLER ACTIONS ═══════════

    // Tüm gönderilen istekleri ayarla (useGetSentRequests hook'u çağırır)
    setSentFriendRequests: (requests) => set({ sentFriendRequests: requests }),

    // Yeni gönderilen istek ekle
    addSentFriendRequest: (request) => set((state) => ({
        friendListVersion: state.friendListVersion + 1,
        sentFriendRequests: [...state.sentFriendRequests.filter(item => item._id !== request._id), request]
    })),

    // Gönderilen isteği kaldır (iptal edildiğinde, useCancelRequest hook'u çağırır)
    removeSentFriendRequest: (requestId) => set((state) => ({
        friendListVersion: state.friendListVersion + 1,
        sentFriendRequests: state.sentFriendRequests.filter(r => r._id !== requestId)
    })),

    // ═══════════ MESAJ İSTEKLERİ ACTIONS ═══════════

    // Mesaj isteklerini ayarla (useGetMessageRequests hook'u çağırır)
    // Bunlar arkadaş olunmadan gönderilen mesajlar, pending conversation'dan gelir
    setMessageRequests: (requests) => set(state => {
        const boundaries = useConversation.getState().clearedThrough;
        const previous = new Map(state.messageRequests.map(item => [item._id, item]));
        return { messageRequests: requests.map(item => boundaries[item._id] && !(item.lastMessage?._id > boundaries[item._id]) ?
            previous.get(item._id) || item : item).filter(item =>
            !boundaries[item._id] || item.lastMessage?._id > boundaries[item._id]) };
    }),
    reset: () => set(state => ({ friendListVersion: state.friendListVersion + 1, friends: [], incomingFriendRequests: [], sentFriendRequests: [], messageRequests: [] }))
}));
export default useFriendStore;

/*
📌 STORE KULLANIM AKIŞI:
┌─────────────────────────────────────────────────────────────┐
│                    useFriendStore                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  useGetFriends()        → setFriends([...])                │
│  useGetFriendRequests() → setIncomingFriendRequests([...])  │
│  useGetSentRequests()   → setSentFriendRequests([...])      │
│  useGetMessageRequests()→ setMessageRequests([...])         │
│                                                             │
│  useRespondToFriendRequests() → addFriend() + removeIncoming│
│  useRemoveFriend()            → removeFriend()              │
│  useCancelRequest()           → removeSentFriendRequest()   │
│  Socket.IO bildirimi          → addIncomingFriendRequest()  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
*/
