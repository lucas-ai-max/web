import React from 'react';
import './Roundtable.css';

const Roundtable = ({ activeSpeaker, thinkingSpeaker, messages }) => {
    // Positions for 5 seats based on the new background image placeholders
    // 1: Bottom Left (Zuck)
    // 2: Top Left (Gates)
    // 3: Top Center (Bezos)
    // 4: Top Right (Musk)
    // 5: Bottom Right (Cook)
    const seats = [
        { id: 1, name: 'Zuck', top: '58%', left: '13%', transform: 'translate(-50%, -50%)' },
        { id: 2, name: 'Gates', top: '18%', left: '28%', transform: 'translate(-50%, -50%)' }, // Moved right
        { id: 3, name: 'Bezos', top: '15%', left: '46%', transform: 'translate(-50%, -50%)' }, // Moved left
        { id: 4, name: 'Musk', top: '18%', left: '68%', transform: 'translate(-50%, -50%)' }, // Moved left
        { id: 5, name: 'Cook', top: '58%', left: '83%', transform: 'translate(-50%, -50%)' },
    ];

    const getLatestMessage = (seatId) => {
        // If activeSpeaker is an array (simultaneous mode), check if seatId is in it
        if (Array.isArray(activeSpeaker)) {
            if (!activeSpeaker.includes(seatId)) return null;
        } else if (activeSpeaker !== seatId) {
            return null;
        }

        const seatMessages = messages.filter(m => m.speakerId === seatId);
        return seatMessages.length > 0 ? seatMessages[seatMessages.length - 1].text : null;
    };

    return (
        <div className="roundtable-container">
            <div className="roundtable-bg">
                <img src="/roundtable_bg.png" alt="Roundtable" />

                {seats.map((seat) => {
                    const message = getLatestMessage(seat.id);
                    // Check if this seat is active (either single ID or in array)
                    const isActive = Array.isArray(activeSpeaker)
                        ? activeSpeaker.includes(seat.id)
                        : activeSpeaker === seat.id;

                    const isThinking = thinkingSpeaker === seat.id;

                    return (
                        <div
                            key={seat.id}
                            className={`seat-container ${isActive ? 'active' : ''}`}
                            style={{ top: seat.top, left: seat.left, transform: seat.transform }}
                        >
                            {/* Avatar placeholder is hidden via CSS but kept for structure if needed later */}
                            <div className="avatar-placeholder">
                                <span>{seat.name}</span>
                            </div>

                            {isThinking && (
                                <div className="thinking-bubble">
                                    <div className="thinking-dot"></div>
                                    <div className="thinking-dot"></div>
                                    <div className="thinking-dot"></div>
                                </div>
                            )}

                            {message && isActive && !isThinking && (
                                <div className={`speech-bubble ${isActive ? 'visible' : ''}`}>
                                    {message}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Roundtable;
