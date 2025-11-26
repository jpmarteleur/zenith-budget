import React from 'react';
import type { useBudget } from '../hooks/useBudget';

type DashboardPageProps = ReturnType<typeof useBudget>;

const DashboardPage: React.FC<DashboardPageProps> = (props) => {
  return (
    <div className="space-y-6">
      {/* Visuals removed as requested */}
    </div>
  );
};

export default DashboardPage;