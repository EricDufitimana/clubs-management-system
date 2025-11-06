import * as React from 'react';

interface ClubInviteEmailProps {
  clubName: string;
  role: string;
  inviteLink: string;
  expiresAt: string;
}

export const ClubInviteEmail: React.FC<ClubInviteEmailProps> = ({
  clubName,
  role,
  inviteLink,
  expiresAt,
}) => (
  <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
    <h1 style={{ color: '#2563eb' }}>You're Invited! 🎉</h1>
    
    <p>You've been invited to join <strong>{clubName}</strong> as the <strong>{role}</strong>.</p>
    
    <div style={{ 
      backgroundColor: '#f3f4f6', 
      padding: '20px', 
      borderRadius: '8px',
      margin: '20px 0' 
    }}>
      <p style={{ margin: '0 0 15px 0' }}>Click the button below to accept your invitation:</p>
      
      <a 
        href={inviteLink}
        style={{
          backgroundColor: '#2563eb',
          color: 'white',
          padding: '12px 24px',
          textDecoration: 'none',
          borderRadius: '6px',
          display: 'inline-block',
          fontWeight: 'bold'
        }}
      >
        Accept Invitation
      </a>
    </div>
    
    <p style={{ color: '#6b7280', fontSize: '14px' }}>
      This invitation expires on {expiresAt}
    </p>
    
    <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
    
    <p style={{ color: '#9ca3af', fontSize: '12px' }}>
      If you didn't expect this invitation, you can safely ignore this email.
    </p>
  </div>
);

