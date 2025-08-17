import React from 'react';
import UserAvatar from './UserAvatar';

interface HeaderProps {
    currentPage: 'dashboard' | 'curriculum';
    onSettingsClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onSettingsClick }) => {
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
                        className={`relative pb-1 transition-colors ${currentPage === 'dashboard'
                            ? "text-pink-500 hover:text-cyan-400"
                            : "text-gray-400 hover:text-white hover:text-cyan-400"
                            } before:content-[''] before:absolute before:bottom-0 before:left-0 before:w-0 before:h-0.5 before:bg-cyan-400 before:transition-all before:duration-300 hover:before:w-full`}
                    >
                        Dashboard
                    </a>
                    <a
                        href="/modules"
                        className={`relative pb-1 transition-colors ${currentPage === 'curriculum'
                            ? "text-pink-500 hover:text-cyan-400"
                            : "text-gray-400 hover:text-white hover:text-cyan-400"
                            } before:content-[''] before:absolute before:bottom-0 before:left-0 before:w-0 before:h-0.5 before:bg-cyan-400 before:transition-all before:duration-300 hover:before:w-full`}
                    >
                        Curriculum
                    </a>
                </div>
                <UserAvatar onSettingsClick={onSettingsClick} />
            </div>
        </header>
    );
};

export default Header;
