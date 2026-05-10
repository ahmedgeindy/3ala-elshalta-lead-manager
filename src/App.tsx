import { Routes, Route } from 'react-router-dom';
import OperatorApp from './components/OperatorApp';
import SmartMenuPageView from './components/SmartMenuPageView';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<OperatorApp />} />
      <Route path="/m/:slug" element={<SmartMenuPageView />} />
    </Routes>
  );
}