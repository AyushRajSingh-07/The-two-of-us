import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw, Plus, Trash2, Trophy, Heart, Edit3 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { fireHeartConfetti } from '../../common/Confetti';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const DEFAULT_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'Where did we officially have our very first date?',
    options: ['Cozy coffee shop downtown', 'By the waterfront park', 'Italian pizza place', 'Cinema & arcade'],
    correctIndex: 0,
    explanation: 'We ordered iced lattes and ended up talking for three hours straight!',
  },
  {
    id: 'q2',
    question: 'Who is more likely to fall asleep during a late-night movie?',
    options: ['Alex', 'Jordan', 'Both equally', 'Neither, movie buffs!'],
    correctIndex: 1,
    explanation: 'Within 20 minutes of starting any movie after 10 PM!',
  },
  {
    id: 'q3',
    question: 'What is our go-to comfort meal after a long, tiring week?',
    options: ['Hot ramen & dumplings', 'Cheesy pasta & garlic bread', 'Homemade smashburgers', 'Spicy Thai curry'],
    correctIndex: 0,
    explanation: 'Steaming hot bowls of ramen never fail to warm our hearts.',
  },
  {
    id: 'q4',
    question: 'If we could teleport anywhere in the world tomorrow morning, where are we going?',
    options: ['A secluded cabin in the Swiss Alps', 'A coastal villa in Amalfi', 'A bustling night market in Tokyo', 'A cozy seaside cottage in Scotland'],
    correctIndex: 2,
    explanation: 'Exploring street food, neon lights, and late-night arcades together!',
  },
  {
    id: 'q5',
    question: 'What is our favorite running inside joke or habit?',
    options: ['Inventing silly nicknames for pets', 'Speaking in dramatic movie trailer voices', 'Stealing each other\'s hoodies', 'Debating what to eat for an hour'],
    correctIndex: 2,
    explanation: 'Your hoodies are simply 10x warmer and cozier!',
  },
];

export const QuizGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { currentUser, couple } = useAuth();
  const [questions, setQuestions] = useState<QuizQuestion[]>(DEFAULT_QUESTIONS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // New question form state
  const [newQText, setNewQText] = useState('');
  const [newOptions, setNewOptions] = useState(['', '', '', '']);
  const [newCorrect, setNewCorrect] = useState(0);
  const [newExplanation, setNewExplanation] = useState('');

  const currentQ = questions[currentIndex];

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    if (idx === currentQ.correctIndex) {
      setScore((prev) => prev + 1);
      fireHeartConfetti();
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      fireHeartConfetti();
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQText.trim() || newOptions.some((o) => !o.trim())) return;

    const newQuestion: QuizQuestion = {
      id: 'q-' + Date.now(),
      question: newQText.trim(),
      options: newOptions.map((o) => o.trim()),
      correctIndex: newCorrect,
      explanation: newExplanation.trim() || 'A cherished memory of us.',
    };

    setQuestions([...questions, newQuestion]);
    setNewQText('');
    setNewOptions(['', '', '', '']);
    setNewExplanation('');
    setIsEditing(false);
  };

  const handleDeleteQuestion = (id: string) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((q) => q.id !== id));
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 md:p-8 border border-rose-100 shadow-xl animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-rose-100 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-warmgray-500 hover:text-rose-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Games
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1 text-xs font-medium text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 transition"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Close Editor' : 'Edit / Add Questions'}</span>
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-6">
          <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-200">
            <h3 className="text-sm font-bold text-rose-900 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add a Custom Question About Us
            </h3>
            <form onSubmit={handleAddQuestion} className="space-y-3">
              <input
                type="text"
                placeholder="Question (e.g. What song was playing during our first road trip?)"
                value={newQText}
                onChange={(e) => setNewQText(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-rose-200 rounded-xl"
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {newOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctChoice"
                      checked={newCorrect === i}
                      onChange={() => setNewCorrect(i)}
                      title="Mark as correct answer"
                    />
                    <input
                      type="text"
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const copy = [...newOptions];
                        copy[i] = e.target.value;
                        setNewOptions(copy);
                      }}
                      className="w-full px-3 py-1.5 text-xs border border-warmgray-200 rounded-xl"
                      required
                    />
                  </div>
                ))}
              </div>
              <input
                type="text"
                placeholder="Sweet memory story / explanation (revealed after answering)"
                value={newExplanation}
                onChange={(e) => setNewExplanation(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-warmgray-200 rounded-xl"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 text-white font-semibold text-xs rounded-xl hover:bg-rose-700 transition"
              >
                Add Question
              </button>
            </form>
          </div>

          <div>
            <h4 className="text-xs font-bold text-warmgray-700 uppercase tracking-wider mb-2">
              Current Quiz Questions ({questions.length})
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {questions.map((q, idx) => (
                <div key={q.id} className="flex items-center justify-between p-3 bg-warmgray-50 rounded-xl text-xs">
                  <span className="font-medium text-warmgray-800 truncate pr-2">
                    {idx + 1}. {q.question}
                  </span>
                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                    title="Delete question"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : isFinished ? (
        <div className="text-center py-8 space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Trophy className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-warmgray-900">Quiz Completed!</h2>
          <p className="text-sm text-warmgray-600">
            {currentUser.name}, you scored <strong className="text-rose-600 text-lg">{score}</strong> out of{' '}
            <strong className="text-rose-600 text-lg">{questions.length}</strong>!
          </p>
          <div className="p-4 bg-rose-50/70 rounded-2xl max-w-sm mx-auto border border-rose-200">
            <p className="font-serif italic text-rose-800 text-sm">
              {score === questions.length
                ? '💕 100% Soulmate Score! You know our story by heart.'
                : score >= questions.length / 2
                ? '✨ Amazing job! You know so much of our journey together.'
                : '💖 Time for another date night to make even more memories!'}
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md transition"
            >
              <RotateCcw className="w-4 h-4" /> Play Again
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Progress Header */}
          <div className="flex items-center justify-between text-xs font-semibold text-warmgray-500">
            <span>
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="flex items-center gap-1 text-rose-600">
              <Heart className="w-3.5 h-3.5 fill-rose-500" /> Score: {score}
            </span>
          </div>

          <div className="w-full bg-rose-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-rose-600 h-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question Text */}
          <div className="py-2">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-warmgray-900">
              {currentQ.question}
            </h2>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQ.correctIndex;
              let btnClass = 'border-warmgray-200 hover:border-rose-300 bg-white hover:bg-rose-50/40 text-warmgray-800';

              if (isAnswered) {
                if (isCorrect) {
                  btnClass = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                } else if (isSelected) {
                  btnClass = 'border-rose-500 bg-rose-50 text-rose-900';
                } else {
                  btnClass = 'opacity-50 border-warmgray-200 bg-warmgray-50';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={isAnswered}
                  className={`p-4 rounded-2xl border text-left text-sm transition-all flex items-center justify-between shadow-xs ${btnClass}`}
                >
                  <span>{opt}</span>
                  {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
                  {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Story Explanation */}
          {isAnswered && (
            <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl text-xs text-rose-900 animate-fade-in flex items-start gap-2">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Memory Note: </span>
                <span>{currentQ.explanation}</span>
              </div>
            </div>
          )}

          {/* Next Button */}
          {isAnswered && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleNext}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md transition"
              >
                {currentIndex < questions.length - 1 ? 'Next Question →' : 'See Our Results! ✨'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
