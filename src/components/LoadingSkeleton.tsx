import React from 'react';

interface LoadingSkeletonProps {
  variant?: 'post' | 'comment' | 'profile' | 'chat';
  count?: number;
  className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  variant = 'post', 
  count = 1,
  className = '' 
}) => {
  const renderPostSkeleton = () => (
    <output className={`loading-skeleton post-skeleton ${className}`} aria-label="Loading post">
      <div className="skeleton-header">
        <div className="skeleton-avatar"></div>
        <div className="skeleton-user-info">
          <div className="skeleton-username"></div>
          <div className="skeleton-timestamp"></div>
        </div>
      </div>
      <div className="skeleton-content">
        <div className="skeleton-text-line skeleton-text-long"></div>
        <div className="skeleton-text-line skeleton-text-medium"></div>
        <div className="skeleton-text-line skeleton-text-short"></div>
      </div>
      <div className="skeleton-actions">
        <div className="skeleton-action-btn"></div>
        <div className="skeleton-action-btn"></div>
        <div className="skeleton-action-btn"></div>
      </div>
      <span className="sr-only">Loading post content...</span>
    </output>
  );

  const renderCommentSkeleton = () => (
    <output className={`loading-skeleton comment-skeleton ${className}`} aria-label="Loading comment">
      <div className="skeleton-header">
        <div className="skeleton-avatar skeleton-avatar-small"></div>
        <div className="skeleton-user-info">
          <div className="skeleton-username skeleton-username-short"></div>
          <div className="skeleton-timestamp skeleton-timestamp-short"></div>
        </div>
      </div>
      <div className="skeleton-content">
        <div className="skeleton-text-line skeleton-text-medium"></div>
        <div className="skeleton-text-line skeleton-text-short"></div>
      </div>
      <span className="sr-only">Loading comment...</span>
    </output>
  );

  const renderProfileSkeleton = () => (
    <output className={`loading-skeleton profile-skeleton ${className}`} aria-label="Loading profile">
      <div className="skeleton-profile-header">
        <div className="skeleton-avatar skeleton-avatar-large"></div>
        <div className="skeleton-profile-info">
          <div className="skeleton-username skeleton-username-long"></div>
          <div className="skeleton-bio-line"></div>
          <div className="skeleton-bio-line skeleton-bio-short"></div>
        </div>
      </div>
      <div className="skeleton-stats">
        <div className="skeleton-stat"></div>
        <div className="skeleton-stat"></div>
        <div className="skeleton-stat"></div>
      </div>
      <span className="sr-only">Loading profile information...</span>
    </output>
  );

  const renderChatSkeleton = () => (
    <output className={`loading-skeleton chat-skeleton ${className}`} aria-label="Loading chat message">
      <div className="skeleton-message">
        <div className="skeleton-avatar skeleton-avatar-small"></div>
        <div className="skeleton-message-content">
          <div className="skeleton-message-bubble">
            <div className="skeleton-text-line skeleton-text-medium"></div>
            <div className="skeleton-text-line skeleton-text-short"></div>
          </div>
          <div className="skeleton-timestamp skeleton-timestamp-small"></div>
        </div>
      </div>
      <span className="sr-only">Loading chat message...</span>
    </output>
  );

  const renderSkeleton = () => {
    switch (variant) {
      case 'comment':
        return renderCommentSkeleton();
      case 'profile':
        return renderProfileSkeleton();
      case 'chat':
        return renderChatSkeleton();
      case 'post':
      default:
        return renderPostSkeleton();
    }
  };

  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>
          {renderSkeleton()}
        </div>
      ))}
    </>
  );
};

export default LoadingSkeleton;
