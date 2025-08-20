
import { fetchWithAuth } from './utils';

export const getStudentQuizzes = async () => {
  return await fetchWithAuth("/student/quizzes/me");
};

export const checkAnswer = async (payload) => {
  return await fetchWithAuth("/student/quizzes/check-answer", "POST", payload);
};
