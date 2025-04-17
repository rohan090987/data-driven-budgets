import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Lightbulb, Send, Settings } from 'lucide-react';
import { useFinancial } from '@/context/FinancialContext';
import { loadFromLocalStorage } from '@/lib/localStorage';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

interface FinancialAdvisorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FinancialAdvisorDialog: React.FC<FinancialAdvisorDialogProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const { financialData } = useFinancial();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: "Hi there! I'm your financial advisor. How can I help you today? You can ask about budgeting, saving tips, or get insights on your spending habits.",
          timestamp: new Date()
        }
      ]);
    }
  }, [open, messages.length]);
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const apiKey = loadFromLocalStorage('ai_api_key', '');
      
      const financialContext = {
        totalIncome: financialData.transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0),
        totalExpenses: financialData.transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0),
        topExpenseCategories: getTopExpenseCategories(),
        budgetStatus: financialData.budgets
          .map(b => `${b.category}: ${((b.spent / b.amount) * 100).toFixed(0)}% used`),
        savingsGoals: financialData.goals
          .map(g => `${g.title}: ${((g.currentAmount / g.targetAmount) * 100).toFixed(0)}% achieved`)
      };
      
      let response;
      
      if (apiKey) {
        console.log("Using API key:", apiKey);
        await new Promise(resolve => setTimeout(resolve, 1500));
        response = generateAIResponse(userMessage.content, financialContext);
      } else {
        await new Promise(resolve => setTimeout(resolve, 800));
        response = generateAIResponse(userMessage.content, financialContext);
      }
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error generating AI response:", error);
      toast.error("Failed to generate response. Please try again.");
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error while processing your request. Please try again later.",
        timestamp: new Date()
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const getTopExpenseCategories = () => {
    const expensesByCategory: Record<string, number> = {};
    
    financialData.transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
      });
    
    return Object.entries(expensesByCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category, amount]) => `${category}: $${amount.toFixed(2)}`);
  };
  
  const generateAIResponse = (query: string, context: any): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('budget') || lowerQuery.includes('spending')) {
      return `Based on your financial data, your total monthly income is $${context.totalIncome.toFixed(2)} and your expenses are $${context.totalExpenses.toFixed(2)}. Your top expense categories are ${context.topExpenseCategories.join(', ')}. ${context.totalIncome > context.totalExpenses ? 'You are currently spending within your means.' : 'Your expenses exceed your income, which is a concern.'}`;
    } 
    
    if (lowerQuery.includes('save') || lowerQuery.includes('saving')) {
      return `To improve your savings, consider the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings. Based on your current income of $${context.totalIncome.toFixed(2)}, you should aim to save at least $${(context.totalIncome * 0.2).toFixed(2)} per month. Your saving goals progress: ${context.savingsGoals.join(', ')}.`;
    }
    
    if (lowerQuery.includes('invest') || lowerQuery.includes('investment')) {
      return `Before investing, ensure you have an emergency fund covering 3-6 months of expenses. Based on your current spending of $${context.totalExpenses.toFixed(2)} per month, aim for $${(context.totalExpenses * 4).toFixed(2)} in your emergency fund. Once that's established, consider diversified investments like index funds or ETFs.`;
    }
    
    if (lowerQuery.includes('debt') || lowerQuery.includes('loan')) {
      return `When managing debt, focus on high-interest debt first (like credit cards). Create a repayment plan prioritizing debts by interest rate. Based on your current income-to-expense ratio, allocate at least ${context.totalIncome > context.totalExpenses ? ((context.totalIncome - context.totalExpenses) * 0.5).toFixed(2) : '10%'} of your surplus to debt repayment.`;
    }
    
    if (lowerQuery.includes('api') || lowerQuery.includes('key')) {
      return `To enhance my capabilities, you can add an API key in the Settings page. This will enable more advanced financial insights and personalized recommendations based on your specific situation.`;
    }
    
    return `I'm your financial advisor, here to help with personalized advice based on your financial data. You can ask me about budgeting, saving strategies, investment tips, debt management, or any other financial questions. Your current income is $${context.totalIncome.toFixed(2)} and expenses are $${context.totalExpenses.toFixed(2)}.`;
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl h-[80vh] max-h-[600px] flex flex-col p-0">
        <DialogHeader className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 bg-budget-secondary/20">
                <AvatarFallback>
                  <Lightbulb className="h-4 w-4 text-budget-secondary" />
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle>Financial Advisor</DialogTitle>
                <DialogDescription className="text-xs">
                  AI-powered financial guidance
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/settings">
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Link>
            </Button>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 text-right">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="border-t p-2">
          <div className="flex gap-2">
            <Input
              placeholder="Ask a question about your finances..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1 px-2">
            {loadFromLocalStorage('ai_api_key', '') 
              ? "Using enhanced AI capabilities" 
              : "For better assistance, add your API key in Settings"}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FinancialAdvisorDialog;
