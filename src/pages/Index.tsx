import React from 'react';
import { Dashboard } from '@/components/Dashboard';

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-start pb-20 px-0 max-w-md mx-auto w-full">
      <div className="w-full">
        <Dashboard />
      </div>
    </div>
  );
};

export default Index;
