// 404 Not Found page
import { FileQuestion } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        {/* 404 icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
            <FileQuestion size={48} className="text-gray-600" />
          </div>
        </div>
        
        {/* Title */}
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Page Not Found
        </h2>
        
        {/* Message */}
        <p className="text-gray-600 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        
        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button
            variant="primary"
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            Go to Home
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.close()}
            className="w-full"
          >
            Close Browser
          </Button>
        </div>
      </div>
    </div>
  );
};