import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Terminal,
  Plus,
  Play,
  Pause,
  Users,
  Trophy,
  Timer,
  LogOut,
  Code,
  Film,
  Zap,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Room {
  id: string;
  code: string;
  name: string;
  status: string;
  created_at: string;
  participant_count: number;
}

interface Level {
  id: string;
  title: string;
  room_id: string;
  status: string;
}

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showNewRoom, setShowNewRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: '',
    code: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const fetchRooms = async () => {
      const { data, error: roomError } = await supabase
        .from('rooms')
        .select('*, room_participants(count)')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (roomError) {
        setError(roomError.message);
        return;
      }

      setRooms(
        data.map((room) => ({
          ...room,
          participant_count: room.room_participants[0].count,
        }))
      );
    };

    fetchRooms();

    const roomSubscription = supabase
      .channel('admin_room_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, fetchRooms)
      .subscribe();

    return () => {
      roomSubscription.unsubscribe();
    };
  }, [user, navigate]);

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert([
          {
            name: newRoom.name,
            code: newRoom.code,
            created_by: user?.id,
            status: 'waiting',
          },
        ])
        .select()
        .single();

      if (roomError) throw roomError;

      // Create default levels for the room
      const levels = [
        {
          title: "The Matrix's Digital Rain",
          description: "Create a function that generates the iconic 'Digital Rain' effect from The Matrix. The function should transform a string into a cascading pattern of characters.",
          initial_code: "function digitalRain(input) {\n  // Your code here\n}",
          test_cases: [
            {
              input: "hello",
              expected: "h\ne\nl\nl\no",
              description: "Transform 'hello' into a vertical cascade"
            },
            {
              input: "neo",
              expected: "n\ne\no",
              description: "Transform 'neo' into a vertical cascade"
            }
          ],
          movie_reference: "The Matrix (1999)",
          difficulty: "medium",
          room_id: room.id,
          status: 'waiting'
        },
        {
          title: "Inception's Dream Levels",
          description: "Create a function that calculates how much time passes in reality given the time spent in each dream level, where each level makes time pass 12 times slower.",
          initial_code: "function dreamTime(levels) {\n  // Your code here\n}",
          test_cases: [
            {
              input: "1",
              expected: "12",
              description: "1 hour in level 1 = 12 hours in reality"
            },
            {
              input: "2",
              expected: "144",
              description: "1 hour in level 2 = 144 hours in reality"
            }
          ],
          movie_reference: "Inception (2010)",
          difficulty: "hard",
          room_id: room.id,
          status: 'waiting'
        },
        {
          title: "Back to the Future Time Circuits",
          description: "Create a function that calculates the exact time difference between two dates in years, months, days, hours, and minutes, just like Doc's time circuits!",
          initial_code: "function timeDifference(date1, date2) {\n  // Your code here\n}",
          test_cases: [
            {
              input: "1985-10-26,1955-11-05",
              expected: "29 years, 11 months, 21 days",
              description: "Calculate time difference between key dates"
            }
          ],
          movie_reference: "Back to the Future (1985)",
          difficulty: "easy",
          room_id: room.id,
          status: 'waiting'
        }
      ];

      const { error: levelsError } = await supabase
        .from('levels')
        .insert(levels);

      if (levelsError) throw levelsError;

      setShowNewRoom(false);
      setNewRoom({ name: '', code: '' });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleRoomStatus = async (roomId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'waiting' : 'active';
      
      if (newStatus === 'active') {
        // Activate the first level when starting the room
        await supabase
          .from('levels')
          .update({ status: 'active' })
          .eq('room_id', roomId)
          .eq('status', 'waiting')
          .limit(1);
      }

      await supabase
        .from('rooms')
        .update({ status: newStatus })
        .eq('id', roomId);
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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <Terminal className="text-purple-500 w-8 h-8" />
            <h1 className="text-2xl font-bold ml-2">CodeChase Admin</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowNewRoom(true)}
              className="flex items-center px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Room
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* New Room Modal */}
        {showNewRoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-gray-800 rounded-lg p-6 w-full max-w-md"
            >
              <h2 className="text-xl font-bold mb-4">Create New Room</h2>
              <form onSubmit={createRoom} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Room Name</label>
                  <input
                    type="text"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                    className="w-full px-4 py-2 rounded bg-white/5 border border-white/10 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Room Code</label>
                  <input
                    type="text"
                    value={newRoom.code}
                    onChange={(e) => setNewRoom({ ...newRoom, code: e.target.value })}
                    className="w-full px-4 py-2 rounded bg-white/5 border border-white/10 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowNewRoom(false)}
                    className="px-4 py-2 rounded bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-purple-500 hover:bg-purple-600 transition-colors"
                  >
                    Create Room
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 rounded-lg p-6 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold">{room.name}</h3>
                  <p className="text-purple-400">#{room.code}</p>
                </div>
                <div className={`px-2 py-1 rounded ${
                  room.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                }`}>
                  {room.status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2 text-blue-400" />
                  <span>{room.participant_count} participants</span>
                </div>
                <div className="flex items-center">
                  <Code className="w-4 h-4 mr-2 text-purple-400" />
                  <span>3 levels</span>
                </div>
                <div className="flex items-center">
                  <Film className="w-4 h-4 mr-2 text-red-400" />
                  <span>Movie themed</span>
                </div>
                <div className="flex items-center">
                  <Zap className="w-4 h-4 mr-2 text-yellow-400" />
                  <span>Gen-Z ready</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <button
                  onClick={() => navigate(`/room/${room.id}`)}
                  className="px-4 py-2 rounded bg-white/5 hover:bg-white/10 transition-colors"
                >
                  View Room
                </button>
                <button
                  onClick={() => toggleRoomStatus(room.id, room.status)}
                  className={`flex items-center px-4 py-2 rounded ${
                    room.status === 'active'
                      ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300'
                      : 'bg-green-500/20 hover:bg-green-500/30 text-green-300'
                  } transition-colors`}
                >
                  {room.status === 'active' ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Pause Room
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Room
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}