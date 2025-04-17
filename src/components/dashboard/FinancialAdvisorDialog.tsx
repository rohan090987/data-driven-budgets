
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { useFinancial } from '@/context/FinancialContext';
import { Lightbulb, Send } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
}

const FinancialAdvisorDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ open, onOpenChange }) => {
  const { financialData } = useFinancial();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your financial advisor. How can I help you today?'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessageId = Date.now().toString();
    setMessages(prev => [
      ...prev,
      {
        id: userMessageId,
        type: 'user',
        content: inputValue
      }
    ]);

    setInputValue('');
    setIsThinking(true);

    // Simulate AI thinking
    setTimeout(() => {
      generateResponse(inputValue);
      setIsThinking(false);
    }, 1000);
  };

  const generateResponse = (query: string) => {
    let response = '';
    const lowerQuery = query.toLowerCase();

    // Generate contextual responses based on financial data and query
    if (lowerQuery.includes('budget') || lowerQuery.includes('spending')) {
      const totalBudget = financialData.budgets.reduce((sum, b) => sum + b.amount, 0);
      const totalSpent = financialData.budgets.reduce((sum, b) => sum + b.spent, 0);
      const percentUsed = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
      
      response = `You've used ${percentUsed}% of your total budget. `;
      
      const overspentBudgets = financialData.budgets.filter(b => b.spent > b.amount);
      if (overspentBudgets.length > 0) {
        response += `You're over budget in ${overspentBudgets.length} categories: ${overspentBudgets.map(b => b.category).join(', ')}.`;
      } else {
        response += "You're staying within your budget limits, great job!";
      }
    } 
    else if (lowerQuery.includes('save') || lowerQuery.includes('saving') || lowerQuery.includes('goal')) {
      const totalGoals = financialData.goals.reduce((sum, g) => sum + g.targetAmount, 0);
      const currentSavings = financialData.goals.reduce((sum, g) => sum + g.currentAmount, 0);
      const percentSaved = totalGoals > 0 ? Math.round((currentSavings / totalGoals) * 100) : 0;
      
      response = `You've saved ${percentSaved}% towards your goals. `;
      
      if (financialData.goals.length === 0) {
        response = "You don't have any savings goals set up yet. Would you like to create one?";
      }
    }
    else if (lowerQuery.includes('income') || lowerQuery.includes('earn')) {
      const income = financialData.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      response = `Your total income is $${income.toFixed(2)}. `;
      
      if (income === 0) {
        response += "You haven't recorded any income yet. Would you like to add an income transaction?";
      }
    }
    else if (lowerQuery.includes('expense') || lowerQuery.includes('spend')) {
      const expenses = financialData.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      response = `Your total expenses are $${expenses.toFixed(2)}. `;
      
      // Find top spending categories
      const expensesByCategory: Record<string, number> = {};
      financialData.transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
          expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
        });
      
      const sortedCategories = Object.entries(expensesByCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      
      if (sortedCategories.length > 0) {
        response += `Your top spending categories are: ${sortedCategories.map(([cat, amount]) => 
          `${cat} ($${amount.toFixed(2)})`).join(', ')}.`;
      }
    }
    else if (lowerQuery.includes('tip') || lowerQuery.includes('advice') || lowerQuery.includes('suggest')) {
      const tips = [
        "Try the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings.",
        "Consider automating your savings by setting up automatic transfers.",
        "Review your recurring subscriptions regularly to eliminate unused services.",
        "Build an emergency fund that covers 3-6 months of expenses.",
        "Track your spending regularly to identify areas where you can cut back."
      ];
      response = tips[Math.floor(Math.random() * tips.length)];
    }
    else {
      // Default responses
      const defaultResponses = [
        "I can help you analyze your budget, track your spending, or provide financial tips. What would you like to know?",
        "I'm here to assist with your financial questions. You can ask about your budget, savings goals, or spending habits.",
        "I can provide insights on your financial situation. Would you like to know about your budget, income, or expenses?",
        "Need help managing your finances? I can offer advice on budgeting, saving, or reducing expenses."
      ];
      response = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }

    // Add assistant message
    setMessages(prev => [
      ...prev,
      {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response
      }
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Financial Advisor
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4 mb-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <Card 
                key={message.id} 
                className={`p-3 ${
                  message.type === 'user' 
                    ? 'bg-primary text-primary-foreground ml-12' 
                    : 'bg-muted mr-12'
                }`}
              >
                {message.content}
              </Card>
            ))}
            {isThinking && (
              <Card className="p-3 bg-muted mr-12">
                <div className="flex space-x-2">
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </Card>
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter className="flex sm:flex-row gap-2">
          <div className="flex flex-1 items-center gap-2">
            <Textarea 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your finances..."
              className="flex-1 min-h-[60px] resize-none"
              disabled={isThinking}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!inputValue.trim() || isThinking}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FinancialAdvisorDialog;
