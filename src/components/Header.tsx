import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UserAvatar from './UserAvatar';

type HeaderSection = 'dashboard' | 'curriculum' | 'students';

interface HeaderProps {
    currentPage: HeaderSection;
    onSettingsClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onSettingsClick }) => {
    const { profile } = useAuth();

    const baseLinkClasses = "relative transition-colors before:content-[''] before:absolute before:bottom-0 before:left-0 before:w-0 before:h-0.5 before:bg-cyan-400 before:transition-all before:duration-300 hover:before:w-full";
    const activeClasses = "text-pink-500 hover:text-cyan-400";
    const inactiveClasses = "text-gray-400 hover:text-white hover:text-cyan-400";

    return (
        <header className="border-b border-border/60 bg-background backdrop-blur-sm">
            <div className="container mx-auto px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img
                        src="/circle_and_hashtag.png"
                        alt="Beatroot Academy Logo"
                        className="h-8 w-8"
                    />
                    <div>
                        <h1 className="text-xl font-bold">
                            <span className="text-white">beat</span><span className="text-pink-500">root</span>
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-8 text-sm font-medium">
                    <a
                        href="/dashboard"
                        className={`${baseLinkClasses} ${currentPage === 'dashboard' ? activeClasses : inactiveClasses}`}
                    >
                        Dashboard
                    </a>
                    <a
                        href="/modules"
                        className={`${baseLinkClasses} ${currentPage === 'curriculum' ? activeClasses : inactiveClasses}`}
                    >
                        Curriculum
                    </a>
                    {profile?.role === 'instructor' && (
                        <a
                            href="/students"
                            className={`${baseLinkClasses} ${currentPage === 'students' ? activeClasses : inactiveClasses}`}
                        >
                            Students
                        </a>
                    )}
                </div>
                <UserAvatar onSettingsClick={onSettingsClick} />
            </div>
        </header>
    );
};

export default Header;
