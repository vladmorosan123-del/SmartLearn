import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import WelcomeAnimation from '@/components/WelcomeAnimation';
import RoleSelection from '@/components/RoleSelection';

const Index = () => {
  const [showAnimation, setShowAnimation] = useState(true);
  const { role, subject } = useApp();
  const navigate = useNavigate();

  // Auto-redirect if user is already logged in
  useEffect(() => {
    if (role && subject) {
      setShowAnimation(false);
      navigate('/dashboard');
    } else if (role && !subject) {
      setShowAnimation(false);
      navigate('/materii');
    }
  }, [role, subject, navigate]);

  return (
    <>
      {showAnimation && (
        <WelcomeAnimation onComplete={() => setShowAnimation(false)} />
      )}
      {!showAnimation && !role && <RoleSelection />}
    </>
  );
};

export default Index;
