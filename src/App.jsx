import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import ExplainerSection from './components/ExplainerSection';
import StatsSection from './components/StatsSection';
import FeaturesSection from './components/FeaturesSection';
import Footer from './components/Footer';
import ReportIssueModal from './components/ReportIssueModal';
import { useState } from 'react';
import './App.css';

function App() {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  return (
    <>
      <Navbar onOpenReport={() => setIsReportModalOpen(true)} />
      <main>
        <HeroSection onOpenReport={() => setIsReportModalOpen(true)} />
        <ExplainerSection />
        <StatsSection />
        <FeaturesSection />
      </main>
      <Footer />
      <ReportIssueModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
    </>
  )
}

export default App;
