import { useState } from 'react';
import WelcomeAnimation from '@/components/WelcomeAnimation';
import RoleSelection from '@/components/RoleSelection';

const Index = () => {
  const [showAnimation, setShowAnimation] = useState(true);

  return (
    <>
      {showAnimation && (
        <WelcomeAnimation onComplete={() => setShowAnimation(false)} />
      )}
      {!showAnimation && <RoleSelection />}
    </>
  );
};

export default Index;
