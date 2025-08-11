import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { useAssessmentStore } from './assessmentStore';
import { ApiClient } from '../utils/ApiClient';
import { act } from 'react';
import { authState } from '../contexts/AuthContext';

jest.mock('../utils/ApiClient');

const mockedApiClient = ApiClient as jest.Mocked<typeof ApiClient>;
const initialState = useAssessmentStore.getState();

describe('assessmentStore', () => {
  beforeEach(() => {
    useAssessmentStore.setState(initialState);
    jest.clearAllMocks();
    authState.userToken = 'user123';
  });

  afterEach(() => {
    authState.userToken = null;
  });

  test('fetchHistory should update state on successful API call', async () => {
    const mockHistory = [{ id: 'a1', type: 'phq-9', score: 10 }];
    mockedApiClient.assessments.getHistory.mockResolvedValue(mockHistory as any);

    await act(async () => {
      await useAssessmentStore.getState().fetchHistory();
    });

    const state = useAssessmentStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.history).toEqual(mockHistory);
    expect(mockedApiClient.assessments.getHistory).toHaveBeenCalledWith('user123');
  });
  
  test('submitPhq9Result should call the API and then refresh history', async () => {
    const score = 15;
    const answers = [1,2,3,1,2,3,1,2,0];
    mockedApiClient.assessments.submitPhq9Result.mockResolvedValue({} as any);
    mockedApiClient.assessments.getHistory.mockResolvedValue([]); // For the refresh call

    await act(async () => {
      await useAssessmentStore.getState().submitPhq9Result(score, answers);
    });

    expect(mockedApiClient.assessments.submitPhq9Result).toHaveBeenCalledWith('user123', score, answers);
    expect(mockedApiClient.assessments.getHistory).toHaveBeenCalledTimes(1);
  });
  
  test('submitGad7Result should call the API and then refresh history', async () => {
    const score = 12;
    const answers = [1,2,3,1,2,3,0];
    mockedApiClient.assessments.submitGad7Result.mockResolvedValue({} as any);
    mockedApiClient.assessments.getHistory.mockResolvedValue([]); // For the refresh call

    await act(async () => {
      await useAssessmentStore.getState().submitGad7Result(score, answers);
    });

    expect(mockedApiClient.assessments.submitGad7Result).toHaveBeenCalledWith('user123', score, answers);
    expect(mockedApiClient.assessments.getHistory).toHaveBeenCalledTimes(1);
  });
});
