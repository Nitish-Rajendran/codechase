import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Terminal, Trophy, Users, Zap, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Room {
  id: string;
  code: string;
  name: string;
  status: string;
}

interface User {
  username: string;
  points: number;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [activeRooms, setActiveRooms] = useState<Room[]>([]);
  const [topUsers, setTopUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      // Fetch active rooms
      const { data: rooms } = await supabase
        .from('rooms')
        .select('*')
        .eq('status', 'active')
        .limit(5);

      if (rooms) setActiveRooms(rooms);

      // Fetch top users
      const { data: users } = await supabase
        .from('users')
        .select('username, points')
        .order('points', { ascending: false })
        .limit(5);

      if (users) setTopUsers(users);
    };

    fetchData();

    // Subscribe to room updates
    const roomSubscription = supabase
      .channel('room_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      roomSubscription.unsubscribe();
    };
  }, [user, navigate]);

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: room } = await supabase
        .from('rooms')
        .select('id')
        .eq('code', roomCode)
        .single();

      if (!room) {
        setError('Room not found');
        return;
      }

      await supabase
        .from('room_participants')
        .insert([{ room_id: room.id, user_id: user.id }]);

      navigate(`/room/${room.id}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <Terminal className="text-purple-500 w-8 h-8" />
            <h1 className="text-2xl font-bold ml-2">CodeChase</h1>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Join Room Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 p-6 rounded-lg backdrop-blur-lg"
          >
            <div className="flex items-center mb-4">
              <Zap className="text-yellow-500 w-6 h-6" />
              <h2 className="text-xl font-semibold ml-2">Join Room</h2>
            </div>

            <form onSubmit={handleJoinRoom} className="space-y-4">
              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Room Code</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  className="w-full px-4 py-2 rounded bg-white/5 border border-white/10 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  placeholder="Enter room code"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 py-2 rounded-md font-medium hover:opacity-90 transition-opacity"
              >
                Join Room
              </button>
            </form>
          </motion.div>

          {/* Active Rooms Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 p-6 rounded-lg backdrop-blur-lg"
          >
            <div className="flex items-center mb-4">
              <Users className="text-blue-500 w-6 h-6" />
              <h2 className="text-xl font-semibold ml-2">Active Rooms</h2>
            </div>

            <div className="space-y-3">
              {activeRooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between p-3 rounded bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => navigate(`/room/${room.id}`)}
                >
                  <span className="font-medium">{room.name}</span>
                  <span className="text-sm text-purple-400">#{room.code}</span>
                </div>
              ))}
              {activeRooms.length === 0 && (
                <p className="text-center text-gray-400">No active rooms</p>
              )}
            </div>
          </motion.div>

          {/* Leaderboard Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="md:col-span-2 bg-white/10 p-6 rounded-lg backdrop-blur-lg"
          >
            <div className="flex items-center mb-4">
              <Trophy className="text-yellow-500 w-6 h-6" />
              <h2 className="text-xl font-semibold ml-2">Top Coders</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topUsers.map((user, index) => (
                <motion.div
                  key={user.username}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center p-4 rounded bg-white/5"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mr-3">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-sm text-purple-400">{user.points} points</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}