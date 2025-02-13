import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Terminal, Play, Users, Trophy, Timer, ArrowLeft } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Level {
  id: string;
  title: string;
  description: string;
  initial_code: string;
  test_cases: {
    input: string;
    expected: string;
    description: string;
  }[];
  movie_reference: string;
  difficulty: string;
}

interface TestResult {
  passed: boolean;
  message: string;
  output?: string;
}

export default function Room() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState<any>(null);
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
  const [code, setCode] = useState('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const fetchRoomData = async () => {
      try {
        // Fetch room details
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', id)
          .single();

        if (roomError) throw roomError;
        setRoom(roomData);

        // Fetch current level
        const { data: levelData, error: levelError } = await supabase
          .from('levels')
          .select('*')
          .eq('room_id', id)
          .eq('status', 'active')
          .single();

        if (levelError) throw levelError;
        setCurrentLevel(levelData);
        setCode(levelData.initial_code);

        // Fetch participants
        const { data: participantData, error: participantError } = await supabase
          .from('room_participants')
          .select('user_id, users:users(username, points)')
          .eq('room_id', id);

        if (participantError) throw participantError;
        setParticipants(participantData);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchRoomData();

    // Subscribe to room updates
    const roomSubscription = supabase
      .channel(`room:${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, fetchRoomData)
      .subscribe();

    return () => {
      roomSubscription.unsubscribe();
    };
  }, [id, user, navigate]);

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      // In a real implementation, you'd want to run these tests in a secure environment
      // For now, we'll simulate test execution
      const results = currentLevel?.test_cases.map((test) => {
        try {
          // This is a simplified example. In production, you'd want to:
          // 1. Send the code to a secure backend
          // 2. Run tests in a sandboxed environment
          // 3. Handle timeouts and security concerns
          const testFunction = new Function('input', code);
          const output = testFunction(test.input);
          const passed = output.toString() === test.expected;

          return {
            passed,
            message: passed ? 'Test passed!' : 'Test failed',
            output: output.toString(),
          };
        } catch (err: any) {
          return {
            passed: false,
            message: err.message,
          };
        }
      });

      setTestResults(results || []);

      // If all tests pass, submit the solution
      if (results?.every((r) => r.passed)) {
        await supabase.from('submissions').insert([
          {
            user_id: user.id,
            level_id: currentLevel?.id,
            code,
            status: 'completed',
            points: 100, // Calculate points based on time, difficulty, etc.
          },
        ]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-500/20 border border-red-500 text-red-200 p-6 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!room || !currentLevel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin">
          <Terminal className="w-8 h-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white/5 border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center">
              <Terminal className="text-purple-500 w-6 h-6" />
              <h1 className="text-xl font-bold ml-2">{room.name}</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              <span>{participants.length} participants</span>
            </div>
            <div className="flex items-center">
              <Timer className="w-5 h-5 mr-2" />
              <span>Time left: 30:00</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 max-w-7xl mx-auto w-full">
        {/* Left Panel - Problem Description */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/5 rounded-lg p-6 space-y-6"
        >
          <div>
            <h2 className="text-2xl font-bold mb-2">{currentLevel.title}</h2>
            <div className="flex items-center space-x-2 text-sm">
              <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300">
                {currentLevel.difficulty}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-400">{currentLevel.movie_reference}</span>
            </div>
          </div>

          <div className="prose prose-invert">
            <p>{currentLevel.description}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Test Cases</h3>
            <div className="space-y-3">
              {currentLevel.test_cases.map((test, index) => (
                <div
                  key={index}
                  className="p-3 rounded bg-white/5 border border-white/10"
                >
                  <p className="text-sm text-gray-300 mb-2">{test.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-purple-400">Input:</span> {test.input}
                    </div>
                    <div>
                      <span className="text-purple-400">Expected:</span> {test.expected}
                    </div>
                  </div>
                  {testResults[index] && (
                    <div className={`mt-2 text-sm ${testResults[index].passed ? 'text-green-400' : 'text-red-400'}`}>
                      {testResults[index].message}
                      {testResults[index].output && (
                        <div className="text-gray-400">
                          Output: {testResults[index].output}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Center Panel - Code Editor */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="lg:col-span-2 bg-white/5 rounded-lg overflow-hidden flex flex-col"
        >
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-semibold">Solution</h3>
            <button
              onClick={runTests}
              disabled={isRunning}
              className="flex items-center px-4 py-2 rounded bg-purple-500 hover:bg-purple-600 transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4 mr-2" />
              {isRunning ? 'Running...' : 'Run Tests'}
            </button>
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* Participants Sidebar */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed right-4 top-24 bottom-4 w-64 bg-white/5 rounded-lg p-4"
      >
        <div className="flex items-center mb-4">
          <Trophy className="text-yellow-500 w-5 h-5" />
          <h3 className="text-lg font-semibold ml-2">Leaderboard</h3>
        </div>
        <div className="space-y-2">
          {participants
            .sort((a, b) => b.users.points - a.users.points)
            .map((participant, index) => (
              <div
                key={participant.user_id}
                className="flex items-center p-2 rounded bg-white/5"
              >
                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mr-2 text-sm">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium">{participant.users.username}</p>
                  <p className="text-sm text-purple-400">
                    {participant.users.points} points
                  </p>
                </div>
              </div>
            ))}
        </div>
      </motion.div>
    </div>
  );
}