import React from 'react';
import Header from './Header.jsx';
import Hero from './Hero.jsx';
import Features from './Features.jsx';
import Footer from './Footer.jsx';

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Hero />
      <Features />
      <Footer />
    </div>
  );
}

export default App;
