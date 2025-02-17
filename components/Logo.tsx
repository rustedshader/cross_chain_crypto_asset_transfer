const Logo = () => {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            Cross
          </span>
          <span className="relative px-2">
            <span className="absolute inset-0 flex items-center">
              <span className="h-px w-full bg-gradient-to-r from-blue-500 to-purple-600"></span>
            </span>
            <span className="relative text-2xl font-bold text-white px-2 bg-gray-900">
              Chain
            </span>
          </span>
        </div>
      </div>
    );
  };
  
  export default Logo;