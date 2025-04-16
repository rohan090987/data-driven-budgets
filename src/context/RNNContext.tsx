
import React, { createContext, useContext, useState, useEffect } from 'react';
import { TransactionClassifier, getClassifier } from '@/lib/rnnService';
import { useFinancial } from '@/context/FinancialContext';
import { DEFAULT_CATEGORIES } from '@/context/FinancialContext';
import { toast } from 'sonner';

interface RNNContextType {
  classifier: TransactionClassifier | null;
  isModelTrained: boolean;
  isTraining: boolean;
  predictCategory: (description: string) => Promise<string>;
  trainModel: () => Promise<void>;
}

const RNNContext = createContext<RNNContextType | undefined>(undefined);

export const RNNProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { financialData } = useFinancial();
  const [classifier, setClassifier] = useState<TransactionClassifier | null>(null);
  const [isModelTrained, setIsModelTrained] = useState(false);
  const [isTraining, setIsTraining] = useState(false);

  // Initialize classifier
  useEffect(() => {
    const initClassifier = async () => {
      try {
        const classifier = getClassifier(DEFAULT_CATEGORIES);
        
        // Try to load the model from localStorage
        const loaded = await classifier.loadModel();
        if (loaded) {
          setIsModelTrained(true);
        } else if (financialData.transactions.length > 5) {
          // If we have enough data, train automatically
          await trainModelInternal(classifier);
        }
        
        setClassifier(classifier);
      } catch (error) {
        console.error('Error initializing classifier:', error);
      }
    };

    initClassifier();
  }, []);

  // Train model with current transaction data
  const trainModelInternal = async (classifierInstance: TransactionClassifier) => {
    try {
      setIsTraining(true);
      
      // Only use transactions with valid categories
      const trainingData = financialData.transactions
        .filter(t => DEFAULT_CATEGORIES.includes(t.category))
        .map(t => ({ description: t.description, category: t.category }));
      
      if (trainingData.length < 3) {
        toast.error('Need at least 3 transactions to train the model');
        setIsTraining(false);
        return;
      }
      
      await classifierInstance.buildModel();
      await classifierInstance.trainModel(trainingData);
      await classifierInstance.saveModel();
      
      setIsModelTrained(true);
      toast.success('Model trained successfully!');
    } catch (error) {
      console.error('Error training model:', error);
      toast.error('Failed to train model');
    } finally {
      setIsTraining(false);
    }
  };

  const trainModel = async () => {
    if (!classifier) return;
    await trainModelInternal(classifier);
  };

  const predictCategory = async (description: string): Promise<string> => {
    if (!classifier || !isModelTrained) {
      return 'Other'; // Default category if model not ready
    }
    
    try {
      return await classifier.predictCategory(description);
    } catch (error) {
      console.error('Error predicting category:', error);
      return 'Other';
    }
  };

  return (
    <RNNContext.Provider
      value={{
        classifier,
        isModelTrained,
        isTraining,
        predictCategory,
        trainModel,
      }}
    >
      {children}
    </RNNContext.Provider>
  );
};

export const useRNN = () => {
  const context = useContext(RNNContext);
  if (context === undefined) {
    throw new Error('useRNN must be used within a RNNProvider');
  }
  return context;
};
