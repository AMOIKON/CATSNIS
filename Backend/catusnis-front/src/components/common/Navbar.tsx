import React from 'react';
import useAuth from '../../hooks/useAuth';

interface NavbarProps {
    title: string;
}

const Navbar: React.FC<NavbarProps> = ({ title }) => {
    const { person } = useAuth();

    return (
        <nav className="navbar navbar-light bg-white border-bottom px-4">
            <span className="navbar-brand fw-bold text-dark mb-0 h1">
                {title}
            </span>
            <div className="d-flex align-items-center gap-3">
                <span className="text-muted small">
                    Bonjour,{' '}
                    <strong>
                        {person?.firstName} {person?.lastName}
                    </strong>
                </span>
            </div>
        </nav>
    );
};

export default Navbar;