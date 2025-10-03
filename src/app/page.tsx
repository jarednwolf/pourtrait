export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
          Pourtrait
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
            {' '}AI Sommelier
          </span>
        </h1>
        
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Your personal AI-powered wine cellar and sommelier. Discover wines you'll love, 
          manage your collection intelligently, and get expert recommendations tailored to your taste.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-8 py-3 rounded-lg">
            Get Started
          </button>
          <button className="border border-purple-300 text-purple-700 hover:bg-purple-50 font-semibold px-8 py-3 rounded-lg">
            Learn More
          </button>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
          <div className="flex items-center">
            <span className="mr-2">✅</span>
            Free to start
          </div>
          <div className="flex items-center">
            <span className="mr-2">👥</span>
            No wine experience required
          </div>
          <div className="flex items-center">
            <span className="mr-2">⚡</span>
            Instant recommendations
          </div>
        </div>
      </div>
    </div>
  )
}