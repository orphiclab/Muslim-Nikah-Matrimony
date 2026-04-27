'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { profileApi, chatApi } from '@/services/api';
import { getSocket, disconnectSocket } from '@/services/socket';

type Message = {
  id: string; senderProfileId: string; receiverProfileId: string;
  content: string; imageUrl?: string | null; createdAt: string; readAt?: string | null;
};
type Conversation = { id: string; name: string; lastMsg?: string };

// Broadcast total unread count to the rest of the app (e.g. nav badge)
// NOTE: dispatchEvent is synchronous so we defer it to the next tick to avoid
// updating DashboardLayout state while ChatPage is still in React's render/commit cycle.
function broadcastUnread(counts: Record<string, number>) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (typeof window !== 'undefined') {
    localStorage.setItem('mn_unread', String(total));
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('mn_unread_change', { detail: total }));
    }, 0);
  }
}

/* ── Tick components ──────────────────────────────────────────────── */
const SingleTick = () => (
  <svg viewBox="0 0 16 11" fill="none" className="w-4 h-3 inline-block ml-1 align-middle" aria-label="Sent">
    <path d="M1 5.5l3.5 3.5L13 1.5" stroke="#ffffff99" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DoubleTick = ({ blue }: { blue: boolean }) => {
  const color = blue ? '#60a5fa' : '#ffffff99';
  return (
    <svg viewBox="0 0 20 11" fill="none" className="w-5 h-3 inline-block ml-1 align-middle" aria-label={blue ? 'Read' : 'Delivered'}>
      <path d="M1 5.5l3.5 3.5L12 1.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 5.5l3.5 3.5L18 1.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

export default function ChatPage() {
  const [myProfiles, setMyProfiles] = useState<any[]>([]);
  const [selectedMyProfile, setSelectedMyProfile] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [imageFile, setImageFile] = useState<string | null>(null); // base64 preview
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [chatError, setChatError] = useState<string | null>(null); // toast error
  const socketRef = useRef<any>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const selectedChatRef = useRef('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep ref in sync so socket handlers always have the latest selected chat
  useEffect(() => { selectedChatRef.current = selectedChat; }, [selectedChat]);

  // Broadcast unread count to rest of app AFTER state is committed (not during render)
  useEffect(() => {
    broadcastUnread(unreadCounts);
  }, [unreadCounts]);

  // ── Poll authoritative unread counts from DB every 6s ──────────────
  useEffect(() => {
    if (!selectedMyProfile) return;
    const fetchUnread = () => {
      chatApi.unreadCounts(selectedMyProfile).then((r: any) => {
        const counts: Record<string, number> = r ?? {};
        // Zero out the currently-open conversation (those are being read)
        if (selectedChatRef.current) counts[selectedChatRef.current] = 0;
        setUnreadCounts(counts);
      }).catch(() => {});
    };
    fetchUnread(); // run immediately on profile select
    const interval = setInterval(fetchUnread, 6000);
    return () => clearInterval(interval);
  }, [selectedMyProfile]);

  // URL params
  const [startId, setStartId] = useState<string | null>(null);
  const [startName, setStartName] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      setStartId(p.get('start'));
      setStartName(p.get('name'));
    }
  }, []);

  // Load my active profiles
  useEffect(() => {
    profileApi.getMyProfiles().then((r) => {
      const active = (r.data ?? []).filter((p: any) => p.status === 'ACTIVE');
      setMyProfiles(active);
      if (active[0]) setSelectedMyProfile(active[0].id);
    }).finally(() => setLoading(false));
  }, []);

  // Load conversations
  const loadConversations = useCallback((profileId: string) => {
    chatApi.conversations(profileId).then((r) => {
      // Backend returns a pre-sorted flat array (newest first).
      // Fall back to the old sent+received merge if server is older.
      let all: Conversation[];
      if (Array.isArray(r.data?.conversations) && r.data.conversations.length >= 0) {
        all = r.data.conversations.map((c: any) => ({ id: c.id, name: c.name ?? 'Unknown' }));
      } else {
        all = [
          ...(r.data?.sent ?? []).map((m: any) => ({ id: m.receiverProfileId, name: m.receiverProfile?.name ?? 'Unknown' })),
          ...(r.data?.received ?? []).map((m: any) => ({ id: m.senderProfileId, name: m.senderProfile?.name ?? 'Unknown' })),
        ];
      }
      // Prepend the ?start= target if coming from a profile page
      if (startId && startName) {
        all = [{ id: startId, name: startName }, ...all.filter(c => c.id !== startId)];
      }
      setConversations(all);
      if (startId) setSelectedChat(startId);
    });
  }, [startId, startName]);

  useEffect(() => {
    if (!selectedMyProfile) return;
    loadConversations(selectedMyProfile);
  }, [selectedMyProfile, loadConversations]);

  // Load history — always replace with sorted server data
  const loadHistory = useCallback((myId: string, otherId: string) => {
    chatApi.history(myId, otherId).then(r => {
      const incoming: Message[] = r.data ?? [];
      const sorted = [...incoming].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setMessages(sorted);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });
  }, []);

  useEffect(() => {
    if (selectedMyProfile && selectedChat) loadHistory(selectedMyProfile, selectedChat);
  }, [selectedMyProfile, selectedChat, loadHistory]);

  // ── Polling fallback — sync new incoming messages every 4s ─────────
  useEffect(() => {
    if (!selectedMyProfile || !selectedChat) return;
    const interval = setInterval(() => {
      loadHistory(selectedMyProfile, selectedChat);
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedMyProfile, selectedChat, loadHistory]);

  // Mark messages as read when conversation opens or changes
  // Uses a small delay to ensure socket is connected first
  useEffect(() => {
    if (!selectedChat || !selectedMyProfile) return;
    // REST call to persist readAt in DB immediately (works even if socket isn't ready)
    chatApi.markRead(selectedMyProfile, selectedChat).catch(() => {});
    // Also emit via socket so the other party gets the blue tick in real-time
    const timer = setTimeout(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('mark_read', { myProfileId: selectedMyProfile, otherProfileId: selectedChat });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [selectedChat, selectedMyProfile]);

  // ── Socket.IO ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedMyProfile) return;
    const socket = getSocket(selectedMyProfile);
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      // Re-mark as read after reconnect if a chat is selected
      if (selectedChatRef.current) {
        socket.emit('mark_read', { myProfileId: selectedMyProfile, otherProfileId: selectedChatRef.current });
      }
    });
    socket.on('disconnect', () => setConnected(false));

    socket.on('new_message', (msg: Message) => {
      setMessages(prev => {
        // If we already have this exact message ID, skip it
        if (prev.some(m => m.id === msg.id)) return prev;

        // Replace any optimistic temp message from the same sender with the real one
        const hasTempFromMe = msg.senderProfileId === selectedMyProfile &&
          prev.some(m => m.id.startsWith('temp_'));
        if (hasTempFromMe) {
          const filtered = prev.filter(m => !m.id.startsWith('temp_'));
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
          return [...filtered, msg];
        }

        // Message from someone else
        if (msg.senderProfileId !== selectedMyProfile) {
          setConversations(list => {
            // Always move this partner to the TOP (latest message = first)
            const without = list.filter(c => c.id !== msg.senderProfileId);
            const name = list.find(c => c.id === msg.senderProfileId)?.name ?? 'New Message';
            return [{ id: msg.senderProfileId, name }, ...without];
          });
          // If it's the open conversation — mark as read immediately (socket + REST)
          if (msg.senderProfileId === selectedChatRef.current) {
            if (socket.connected) {
              socket.emit('mark_read', { myProfileId: selectedMyProfile, otherProfileId: msg.senderProfileId });
            }
            chatApi.markRead(selectedMyProfile, msg.senderProfileId).catch(() => {});
          } else {
            // Not open conversation — increment unread
            setUnreadCounts(prev => ({
              ...prev,
              [msg.senderProfileId]: (prev[msg.senderProfileId] ?? 0) + 1,
            }));
          }
        } else {
          // My own message — bubble the receiver to top too
          setConversations(list => {
            const without = list.filter(c => c.id !== msg.receiverProfileId);
            const name = list.find(c => c.id === msg.receiverProfileId)?.name ?? '';
            return name ? [{ id: msg.receiverProfileId, name }, ...without] : list;
          });
        }
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        return [...prev, msg].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      });
    });

    socket.on('user_typing', ({ profileId, isTyping: t }: any) => {
      if (profileId === selectedChatRef.current) setIsTyping(t);
    });

    // ── Socket-level errors (e.g. NO_MATCH from send_message) ────────
    socket.on('error', (err: any) => {
      const msg = err?.message ?? 'Something went wrong';
      setChatError(msg);
      setTimeout(() => setChatError(null), 5000);
    });

    // ── Read receipts: update ticks to blue ────────────────────────
    socket.on('messages_read', ({ messageIds, readAt }: { byProfileId: string; messageIds: string[]; readAt: string }) => {
      if (!messageIds?.length) return;
      const idSet = new Set(messageIds);
      setMessages(prev => prev.map(m =>
        idSet.has(m.id) ? { ...m, readAt: readAt ?? new Date().toISOString() } : m
      ));
    });

    return () => {
      socket.off('new_message');
      socket.off('user_typing');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('messages_read');
      socket.off('error');
    };
  }, [selectedMyProfile]);

  useEffect(() => () => disconnectSocket(), []);

  // ── Send message ──────────────────────────────────────────────────
  const send = async () => {
    if ((!newMsg.trim() && !imageFile) || !selectedChat || sending) return;
    const content = newMsg.trim() || '📷 Image';
    const imgUrl = imageFile ?? undefined;
    setNewMsg('');
    setImageFile(null);
    setSending(true);
    const socket = socketRef.current;

    try {
      if (imgUrl) {
        // Always use REST for image messages — WebSocket payloads have size limits
        const result = await chatApi.send({
          senderProfileId: selectedMyProfile,
          receiverProfileId: selectedChat,
          content,
          imageUrl: imgUrl,
        });
        if (result?.data) {
          setMessages(prev => {
            if (prev.some(m => m.id === result.data.id)) return prev;
            return [...prev, result.data].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          });
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        }
      } else if (socket?.connected) {
        // Optimistic insert — show message immediately without waiting for server echo
        const tempId = `temp_${Date.now()}`;
        const optimistic: Message = {
          id: tempId,
          senderProfileId: selectedMyProfile,
          receiverProfileId: selectedChat,
          content,
          createdAt: new Date().toISOString(),
          readAt: null,
        };
        setMessages(prev => [...prev, optimistic].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

        // Emit via socket — server will save and echo new_message (real ID)
        socket.emit('send_message', { senderProfileId: selectedMyProfile, receiverProfileId: selectedChat, content });

        // After a short delay, reload history to replace temp message with real one
        setTimeout(() => loadHistory(selectedMyProfile, selectedChat), 300);
      } else {
        // Fallback: REST
        const result = await chatApi.send({ senderProfileId: selectedMyProfile, receiverProfileId: selectedChat, content });
        if (result?.data) {
          setMessages(prev => {
            if (prev.some(m => m.id === result.data.id)) return prev;
            return [...prev, result.data];
          });
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        }
      }
    } catch (e: any) {
      console.error('Send failed:', e);
      const msg = e?.response?.data?.message ?? e?.message ?? 'Failed to send message';
      setChatError(msg);
      setTimeout(() => setChatError(null), 5000);
    } finally {
      setSending(false);
    }
    loadConversations(selectedMyProfile);
  };

  // ── Pick image ────────────────────────────────────────────────────
  const pickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image is too large. Please choose an image under 5 MB.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageFile(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = ''; // reset so same file can be picked again
  };

  // ── Typing indicator ──────────────────────────────────────────────
  const handleTyping = (val: string) => {
    setNewMsg(val);
    const socket = socketRef.current;
    if (socket?.connected && selectedChat) {
      socket.emit('typing', { senderProfileId: selectedMyProfile, receiverProfileId: selectedChat, isTyping: true });
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        socket.emit('typing', { senderProfileId: selectedMyProfile, receiverProfileId: selectedChat, isTyping: false });
      }, 2000);
    }
  };

  const selectedConvName = conversations.find(c => c.id === selectedChat)?.name ?? '';

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-gray-400">
      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg> Loading…
    </div>
  );

  if (myProfiles.length === 0) return (
    <div className="font-poppins flex flex-col items-center justify-center py-24 text-gray-400">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <p className="font-semibold text-gray-600">No active profiles</p>
      <p className="text-sm mt-1">You need an active profile to use chat</p>
      <a href="/dashboard/subscription" className="mt-4 text-xs bg-[#1C3B35] text-white px-5 py-2.5 rounded-xl hover:bg-[#15302a] transition font-semibold">
        Get Subscription
      </a>
    </div>
  );

  return (
    <div className="font-poppins space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[26px] md:text-[30px] lg:text-[34px] xl:text-[37px] 2xl:text-[40px] font-poppins font-medium text-[#121514]">Messages</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
            <p className="text-gray-400 text-xs">{connected ? 'Connected — real-time' : 'Connecting…'}</p>
          </div>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-2 min-w-0">
          <span className="text-xs text-gray-400 whitespace-nowrap">Chatting as:</span>
          <select value={selectedMyProfile}
            onChange={(e) => {
              // ── Immediately wipe all state from the previous profile ──
              setConversations([]);
              setMessages([]);
              setSelectedChat('');
              setUnreadCounts({});
              setMobileShowChat(false);
              setSelectedMyProfile(e.target.value);
            }}
            className="min-w-0 flex-1 sm:flex-none border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white outline-none focus:border-[#1C3B35] transition">
            {myProfiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <a href="/profiles"
            className="shrink-0 text-xs bg-[#1C3B35] text-white px-3.5 sm:px-4 py-2 rounded-xl hover:bg-[#15302a] transition font-semibold whitespace-nowrap">
            + Browse
          </a>
        </div>
      </div>

      {/* Main chat UI */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex" style={{ height: 'calc(100vh - 260px)', minHeight: '500px' }}>

        {/* ── Conversation list ── */}
        <div className={`${mobileShowChat ? 'hidden' : 'flex'} md:flex w-full md:w-72 border-r border-gray-100 flex-col flex-shrink-0`}>
          <div className="px-4 py-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Conversations</p>
            <p className="text-xs text-gray-400 mt-0.5">{conversations.length} thread{conversations.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-300 px-6 text-center py-12">
                <svg className="w-10 h-10 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <p className="text-sm font-medium text-gray-400">No conversations yet</p>
                <a href="/profiles" className="text-xs text-[#1C3B35] font-semibold mt-2 underline">Browse members →</a>
              </div>
            ) : (
              conversations.map(c => {
                const active = selectedChat === c.id;
                const unread = unreadCounts[c.id] ?? 0;
                return (
                  <button key={c.id}
                    onClick={() => {
                      setSelectedChat(c.id);
                      setIsTyping(false);
                      setMobileShowChat(true);
                      // Clear unread count for this conversation
                      setUnreadCounts(prev => {
                        const next = { ...prev, [c.id]: 0 };
                        broadcastUnread(next);
                        return next;
                      });
                      // Emit mark_read immediately on click
                      if (socketRef.current?.connected) {
                        socketRef.current.emit('mark_read', { myProfileId: selectedMyProfile, otherProfileId: c.id });
                      }
                    }}
                    className={`w-full text-left px-4 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition border-b border-gray-50 ${active ? 'bg-[#EAF2EE] border-l-4 border-l-[#1C3B35]' : ''}`}>
                    <div className="relative flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${active ? 'bg-[#1C3B35] text-white' : 'bg-[#1C3B35]/10 text-[#1C3B35]'}`}>
                        {c.name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      {/* Unread badge on avatar */}
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#22C55E] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold truncate ${unread > 0 ? 'text-gray-900' : active ? 'text-[#1C3B35]' : 'text-gray-700'}`}>{c.name}</p>
                      <p className={`text-xs mt-0.5 truncate ${unread > 0 ? 'text-[#1C3B35] font-medium' : 'text-gray-400'}`}>
                        {unread > 0 ? `${unread} new message${unread > 1 ? 's' : ''}` : 'Tap to view messages'}
                      </p>
                    </div>
                    {active && unread === 0 && <span className="w-2 h-2 rounded-full bg-[#1C3B35] flex-shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Chat area ── */}
        <div className={`${!mobileShowChat ? 'hidden' : 'flex'} md:flex flex-1 flex-col min-w-0`}>
          {!selectedChat ? (
            <div className="flex-1 flex items-center justify-center text-gray-300">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-400">Select a conversation</p>
                <p className="text-xs mt-1 text-gray-300">Or <a href="/profiles" className="text-[#1C3B35] underline">browse members</a> to start a new chat</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-4 py-3.5 border-b border-gray-100 bg-white flex items-center gap-3">
                <button onClick={() => setMobileShowChat(false)} className="md:hidden text-gray-400 p-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <div className="w-9 h-9 rounded-full bg-[#1C3B35] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {selectedConvName?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{selectedConvName}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    {isTyping
                      ? <><span className="text-[#1C3B35] animate-pulse font-medium">typing…</span></>
                      : <><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Active</>
                    }
                  </p>
                </div>
                <a href={`/profiles/${selectedChat}?viewer=${selectedMyProfile}`}
                  className="text-xs text-[#1C3B35] border border-[#1C3B35]/20 px-3 py-1.5 rounded-lg hover:bg-[#1C3B35]/5 transition font-semibold flex-shrink-0">
                  View Profile
                </a>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2.5 bg-[#F9FAFB]">
                {messages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-gray-300 py-12">
                      <p className="text-sm">No messages yet</p>
                      <p className="text-xs mt-1">Say hello to {selectedConvName}! 👋</p>
                    </div>
                  </div>
                ) : (
                  messages.map((m, i) => {
                    const isMine = m.senderProfileId === selectedMyProfile;
                    const prevMsg = messages[i - 1];
                    const showAvatar = !isMine && (!prevMsg || prevMsg.senderProfileId !== m.senderProfileId);
                    const isRead = !!m.readAt;

                    return (
                      <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                        {!isMine && (
                          <div className={`w-7 h-7 rounded-full bg-[#1C3B35]/10 flex items-center justify-center text-[#1C3B35] text-xs font-bold flex-shrink-0 ${!showAvatar ? 'invisible' : ''}`}>
                            {selectedConvName?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${isMine ? 'bg-[#1C3B35] text-white rounded-br-md' : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'}`}>
                          {/* Image attachment */}
                          {m.imageUrl && (
                            <a href={m.imageUrl} target="_blank" rel="noreferrer" className="block mb-2">
                              <img
                                src={m.imageUrl}
                                alt="attachment"
                                className="max-w-[220px] max-h-[200px] rounded-xl object-cover border border-white/20 cursor-pointer hover:opacity-90 transition"
                              />
                            </a>
                          )}
                          {m.content && m.content !== '📷 Image' && (
                            <p className="leading-relaxed break-words">{m.content}</p>
                          )}
                          <div className={`flex items-center justify-end gap-0.5 mt-1 ${isMine ? 'text-white/60' : 'text-gray-400'}`}>
                            <span className="text-xs">
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {/* WhatsApp-style ticks — only for my messages */}
                            {isMine && (
                              isRead
                                ? <DoubleTick blue={true} />   /* ✓✓ blue = read */
                                : <DoubleTick blue={false} />  /* ✓✓ grey = delivered */
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                {/* Typing bubble */}
                {isTyping && (
                  <div className="flex items-end gap-2 justify-start">
                    <div className="w-7 h-7 rounded-full bg-[#1C3B35]/10 flex items-center justify-center text-[#1C3B35] text-xs font-bold flex-shrink-0">
                      {selectedConvName?.[0]?.toUpperCase()}
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm flex gap-1 items-center">
                      {[0, 1, 2].map(i => (
                        <span key={i} className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-100 bg-white overflow-x-hidden">
                {/* Toast error banner */}
                {chatError && (
                  <div className="mx-4 mt-3 flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    <span className="text-red-500 shrink-0 mt-0.5">🔒</span>
                    <p className="text-[12px] text-red-600 font-medium font-poppins leading-snug">{chatError}</p>
                    <button onClick={() => setChatError(null)} className="ml-auto text-red-300 hover:text-red-500 text-xs shrink-0">✕</button>
                  </div>
                )}
                {/* Image preview strip */}
                {imageFile && (
                  <div className="flex items-center gap-2 px-4 pt-3 pb-0">
                    <div className="relative inline-block">
                      <img src={imageFile} alt="preview" className="h-16 w-16 rounded-xl object-cover border border-gray-200 shadow-sm" />
                      <button
                        type="button"
                        onClick={() => setImageFile(null)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-red-500 transition shadow"
                      >
                        ✕
                      </button>
                    </div>
                    <span className="text-xs text-gray-400">Image ready to send</span>
                  </div>
                )}
                <div className="px-4 py-3 flex gap-2 items-end min-w-0">
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={pickImage}
                  />
                  {/* Image attach button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach image"
                    className="flex-shrink-0 p-2.5 rounded-xl text-gray-400 hover:text-[#1C3B35] hover:bg-gray-100 transition border border-gray-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </button>
                  <input
                    value={newMsg}
                    onChange={e => handleTyping(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                    placeholder={`Message ${selectedConvName}…`}
                    className="flex-1 min-w-0 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-[#1C3B35] transition bg-gray-50 focus:bg-white"
                  />
                  <button onClick={send} disabled={sending || (!newMsg.trim() && !imageFile)}
                    className="bg-[#1C3B35] text-white p-2.5 rounded-xl hover:bg-[#15302a] transition disabled:opacity-50 flex-shrink-0">
                    {sending
                      ? <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                      : <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                    }
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
