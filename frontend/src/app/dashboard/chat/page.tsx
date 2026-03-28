'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { profileApi, chatApi } from '@/services/api';
import { getSocket, disconnectSocket } from '@/services/socket';

type Message = {
  id: string; senderProfileId: string; receiverProfileId: string;
  content: string; createdAt: string; readAt?: string | null;
};
type Conversation = { id: string; name: string; lastMsg?: string; unread?: number };

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
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const socketRef = useRef<any>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const selectedChatRef = useRef('');

  // Keep ref in sync so socket handlers always have the latest selected chat
  useEffect(() => { selectedChatRef.current = selectedChat; }, [selectedChat]);

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
      const all: Conversation[] = [
        ...(r.data?.sent ?? []).map((m: any) => ({ id: m.receiverProfileId, name: m.receiverProfile?.name ?? 'Unknown' })),
        ...(r.data?.received ?? []).map((m: any) => ({ id: m.senderProfileId, name: m.senderProfile?.name ?? 'Unknown' })),
      ];
      if (startId && startName) all.unshift({ id: startId, name: startName });
      const seen = new Set();
      const deduped = all.filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true; });
      setConversations(deduped);
      if (startId) setSelectedChat(startId);
    });
  }, [startId, startName]);

  useEffect(() => {
    if (!selectedMyProfile) return;
    loadConversations(selectedMyProfile);
  }, [selectedMyProfile, loadConversations]);

  // Load history
  const loadHistory = useCallback((myId: string, otherId: string) => {
    chatApi.history(myId, otherId).then(r => {
      setMessages(r.data ?? []);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });
  }, []);

  useEffect(() => {
    if (selectedMyProfile && selectedChat) loadHistory(selectedMyProfile, selectedChat);
  }, [selectedMyProfile, selectedChat, loadHistory]);

  // Mark messages as read when conversation opens
  useEffect(() => {
    if (!selectedChat || !selectedMyProfile || !socketRef.current?.connected) return;
    socketRef.current.emit('mark_read', {
      myProfileId: selectedMyProfile,
      otherProfileId: selectedChat,
    });
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
        if (prev.some(m => m.id === msg.id)) return prev;
        // New conversation thread
        if (msg.senderProfileId !== selectedMyProfile) {
          setConversations(list => {
            const exists = list.some(c => c.id === msg.senderProfileId);
            return exists ? list : [{ id: msg.senderProfileId, name: 'New Message' }, ...list];
          });
          // Auto mark read if this conversation is active
          if (msg.senderProfileId === selectedChatRef.current && socket.connected) {
            socket.emit('mark_read', { myProfileId: selectedMyProfile, otherProfileId: msg.senderProfileId });
          }
        }
        const updated = [...prev, msg];
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        return updated;
      });
    });

    socket.on('user_typing', ({ profileId, isTyping: t }: any) => {
      if (profileId === selectedChatRef.current) setIsTyping(t);
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
    };
  }, [selectedMyProfile]);

  useEffect(() => () => disconnectSocket(), []);

  // ── Send message ──────────────────────────────────────────────────
  const send = async () => {
    if (!newMsg.trim() || !selectedChat || sending) return;
    const content = newMsg.trim();
    setNewMsg('');
    setSending(true);
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit('send_message', { senderProfileId: selectedMyProfile, receiverProfileId: selectedChat, content });
      setSending(false);
    } else {
      try {
        await chatApi.send({ senderProfileId: selectedMyProfile, receiverProfileId: selectedChat, content });
        loadHistory(selectedMyProfile, selectedChat);
      } catch (e: any) { alert(e.message); }
      finally { setSending(false); }
    }
    loadConversations(selectedMyProfile);
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
          <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
            <p className="text-gray-400 text-xs">{connected ? 'Connected — real-time' : 'Connecting…'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 whitespace-nowrap">Chatting as:</span>
          <select value={selectedMyProfile}
            onChange={(e) => { setSelectedMyProfile(e.target.value); setSelectedChat(''); setMessages([]); setMobileShowChat(false); }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white outline-none focus:border-[#1C3B35] transition">
            {myProfiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <a href="/dashboard/members"
            className="text-xs bg-[#1C3B35] text-white px-4 py-2 rounded-xl hover:bg-[#15302a] transition font-semibold whitespace-nowrap">
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
                <a href="/dashboard/members" className="text-xs text-[#1C3B35] font-semibold mt-2 underline">Browse members →</a>
              </div>
            ) : (
              conversations.map(c => {
                const active = selectedChat === c.id;
                return (
                  <button key={c.id}
                    onClick={() => {
                      setSelectedChat(c.id);
                      setIsTyping(false);
                      setMobileShowChat(true);
                      // Emit mark_read immediately on click
                      if (socketRef.current?.connected) {
                        socketRef.current.emit('mark_read', { myProfileId: selectedMyProfile, otherProfileId: c.id });
                      }
                    }}
                    className={`w-full text-left px-4 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition border-b border-gray-50 ${active ? 'bg-[#EAF2EE] border-l-4 border-l-[#1C3B35]' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${active ? 'bg-[#1C3B35] text-white' : 'bg-[#1C3B35]/10 text-[#1C3B35]'}`}>
                      {c.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold truncate ${active ? 'text-[#1C3B35]' : 'text-gray-700'}`}>{c.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">Tap to view messages</p>
                    </div>
                    {active && <span className="w-2 h-2 rounded-full bg-[#1C3B35] flex-shrink-0" />}
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
                <p className="text-xs mt-1 text-gray-300">Or <a href="/dashboard/members" className="text-[#1C3B35] underline">browse members</a> to start a new chat</p>
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
                <a href={`/dashboard/members/${selectedChat}?viewer=${selectedMyProfile}`}
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
                          <p className="leading-relaxed break-words">{m.content}</p>
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
              <div className="px-4 py-3 border-t border-gray-100 bg-white flex gap-2 items-end">
                <input
                  value={newMsg}
                  onChange={e => handleTyping(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                  placeholder={`Message ${selectedConvName}…`}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-[#1C3B35] transition bg-gray-50 focus:bg-white"
                />
                <button onClick={send} disabled={sending || !newMsg.trim()}
                  className="bg-[#1C3B35] text-white p-2.5 rounded-xl hover:bg-[#15302a] transition disabled:opacity-50 flex-shrink-0">
                  {sending
                    ? <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                    : <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                  }
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
