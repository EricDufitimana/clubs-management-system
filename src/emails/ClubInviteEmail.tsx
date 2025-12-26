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
  <div style={{ 
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: '#ffffff'
  }}>
    {/* Header */}
    <div style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 30px',
      textAlign: 'center',
      borderRadius: '8px 8px 0 0'
    }}>
      <h1 style={{ 
        color: '#ffffff',
        margin: '0 0 10px 0',
        fontSize: '28px',
        fontWeight: '700',
        letterSpacing: '-0.5px'
      }}>
        Admin Access Invitation
      </h1>
      <p style={{
        color: 'rgba(255, 255, 255, 0.95)',
        margin: 0,
        fontSize: '16px',
        fontWeight: '400'
      }}>
        You've been granted administrative access
      </p>
    </div>

    {/* Main Content */}
    <div style={{ padding: '40px 30px' }}>
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '30px',
      borderRadius: '8px',
        borderLeft: '4px solid #667eea',
        marginBottom: '30px'
      }}>
        <h2 style={{
          color: '#1a202c',
          fontSize: '20px',
          fontWeight: '600',
          margin: '0 0 15px 0'
    }}>
          Welcome to {clubName}
        </h2>
        <p style={{
          color: '#4a5568',
          fontSize: '16px',
          lineHeight: '1.6',
          margin: '0'
        }}>
          You have been invited to join <strong>{clubName}</strong> as an <strong>{role}</strong> with full administrative privileges. 
          This invitation grants you access to the club management system where you can oversee and manage all aspects of the club's operations.
        </p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3 style={{
          color: '#2d3748',
          fontSize: '18px',
          fontWeight: '600',
          margin: '0 0 20px 0'
        }}>
          What You Can Do as an Admin
        </h3>
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          padding: '20px'
        }}>
          <ul style={{
            margin: '0',
            paddingLeft: '20px',
            color: '#4a5568',
            fontSize: '15px',
            lineHeight: '1.8'
          }}>
            <li style={{ marginBottom: '8px' }}><strong>Manage Club Members:</strong> Add, remove, and track all club members</li>
            <li style={{ marginBottom: '8px' }}><strong>Schedule Sessions:</strong> Create and organize club meetings and events</li>
            <li style={{ marginBottom: '8px' }}><strong>Track Attendance:</strong> Record and monitor member attendance at sessions</li>
            <li style={{ marginBottom: '8px' }}><strong>Update Club Information:</strong> Edit club details, descriptions, and settings</li>
            <li style={{ marginBottom: '8px' }}><strong>Generate Reports:</strong> Access analytics and attendance reports</li>
            <li style={{ marginBottom: '0' }}><strong>Invite Other Admins:</strong> Grant access to additional club administrators</li>
          </ul>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3 style={{
          color: '#2d3748',
          fontSize: '18px',
          fontWeight: '600',
          margin: '0 0 15px 0'
        }}>
          Getting Started
        </h3>
        <p style={{
          color: '#4a5568',
          fontSize: '15px',
          lineHeight: '1.6',
          margin: '0 0 20px 0'
        }}>
          To accept this invitation and gain access to the club management dashboard, please click the button below. 
          You'll be guided through a quick registration process to create your admin account and start managing <strong>{clubName}</strong>.
        </p>
        
        {/* CTA Button */}
        <div style={{ textAlign: 'center', margin: '30px 0' }}>
      <a 
        href={inviteLink}
        style={{
              backgroundColor: '#667eea',
              color: '#ffffff',
              padding: '16px 40px',
          textDecoration: 'none',
              borderRadius: '8px',
          display: 'inline-block',
              fontWeight: '600',
              fontSize: '16px',
              boxShadow: '0 4px 6px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s ease'
        }}
      >
            Accept Invitation & Get Access
      </a>
          <p style={{
            color: '#718096',
            fontSize: '13px',
            margin: '15px 0 0 0',
            fontStyle: 'italic'
          }}>
            Or copy and paste this link into your browser:
          </p>
          <p style={{
            color: '#667eea',
            fontSize: '13px',
            margin: '5px 0 0 0',
            wordBreak: 'break-all'
          }}>
            {inviteLink}
          </p>
        </div>
      </div>

      {/* Important Information */}
      <div style={{
        backgroundColor: '#fff5f5',
        border: '1px solid #feb2b2',
        borderRadius: '6px',
        padding: '15px 20px',
        marginBottom: '30px'
      }}>
        <p style={{
          color: '#c53030',
          fontSize: '14px',
          margin: '0',
          fontWeight: '500'
        }}>
          ⏰ <strong>Time Sensitive:</strong> This invitation expires on {expiresAt}. Please accept it before this date to maintain access.
        </p>
      </div>

      <div style={{
        backgroundColor: '#ebf8ff',
        border: '1px solid #90cdf4',
        borderRadius: '6px',
        padding: '15px 20px'
      }}>
        <p style={{
          color: '#2c5282',
          fontSize: '14px',
          margin: '0',
          lineHeight: '1.5'
        }}>
          💡 <strong>Need Help?</strong> If you have any questions about the management system or need assistance with the registration process, please reach out to the club administrator who sent this invitation.
        </p>
      </div>
    </div>
    
    {/* Footer */}
    <div style={{
      backgroundColor: '#f7fafc',
      padding: '30px',
      borderTop: '1px solid #e2e8f0',
      textAlign: 'center',
      borderRadius: '0 0 8px 8px'
    }}>
      <p style={{
        color: '#718096',
        fontSize: '14px',
        margin: '0 0 10px 0',
        lineHeight: '1.5'
      }}>
        We're excited to grant you administrative access to <strong>{clubName}</strong>. With this access, you'll have the tools you need to effectively manage and grow the club!
      </p>
      <p style={{
        color: '#a0aec0',
        fontSize: '12px',
        margin: '15px 0 0 0',
        lineHeight: '1.5'
      }}>
        If you didn't expect this invitation or believe it was sent in error, please disregard this email. No action is required, and no account will be created without your explicit acceptance.
      </p>
      <div style={{
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: '1px solid #e2e8f0'
      }}>
        <p style={{
          color: '#cbd5e0',
          fontSize: '11px',
          margin: '0'
        }}>
          © {new Date().getFullYear()} Club Management System. All rights reserved.
    </p>
      </div>
    </div>
  </div>
);

