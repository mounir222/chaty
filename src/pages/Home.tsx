import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import ChatBoard from '../components/chat/ChatBoard';
import OnlineUsers from '../components/chat/OnlineUsers';

export default function Home() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-dark-900 relative z-0">
          <ChatBoard />
        </main>
        <OnlineUsers />
      </div>
    </div>
  );
}
