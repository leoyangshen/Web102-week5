import React, { useState, useEffect } from 'react';

// Main App component
const App = () => {
    // State to store the currently displayed cat data
    const [currentCat, setCurrentCat] = useState(null);
    // State to manage the ban list. Each item is { type: 'attributeName', value: 'attributeValue' }
    const [banList, setBanList] = useState([]);
    // State for loading indicator
    const [isLoading, setIsLoading] = useState(false);
    // State for error messages
    const [error, setError] = useState(null);
    
    // Function to fetch a new cat from the API
    const fetchCat = async (retries = 0) => {
        setIsLoading(true); // Set loading to true
        setError(null);     // Clear any previous errors

        const MAX_RETRIES = 5; // Limit retries to prevent infinite loops

        try {
            // Fetch multiple cats to increase chances of finding an unbanned one
            const response = await fetch('https://api.thecatapi.com/v1/images/search?has_breeds=1&limit=10', {
                headers: {
                    'x-api-key': 'live_UwGyoc7sllY81oNkrEQT6ctJG0GKKO12RvKh7FdIGBEcjuC796AmrYxCnnNOBETC' // Replace with your actual Cat API key
                }
            });
	    console.log(`Th response is ${response}`);
	    console.log(`Response Status: ${response.status}`);
	    console.log(`Response Status Text: ${response.statusText}`);
	    console.log(`Response OK: ${response.ok}`);
	    console.log('Response Headers:', response.headers); // This will log the Headers object
	    response.headers.forEach((value, name) => {
			    console.log(`${name}: ${value}`);
	    });
            console.log(`Response URL: ${response.url}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
	    console.log('Parsed Cat Data:', data); // <--- THIS IS WHAT YOU WANT TO SEE!

		// Now you can work with 'data', which will be an array of cat objects
		// // For example, to see the first cat's details:
	    if (data.length > 0) {
	        console.log('First Cat Object:', data[0]);
	        console.log('First Cat Breed Name:', data[0].breeds[0]?.name);
	    }

            // Filter for a cat that is not banned
            const unbannedCat = data.find(cat => !isCatBanned(cat, banList));

            if (unbannedCat) {
                // If an unbanned cat is found, set it as the current cat
                setCurrentCat(unbannedCat);
            } else if (retries < MAX_RETRIES) {
                // If no unbanned cat found in this batch, retry fetching
                console.warn(`No unbanned cat found in batch. Retrying... (Attempt ${retries + 1}/${MAX_RETRIES})`);
                await fetchCat(retries + 1); // Recursive call with incremented retry count
            } else {
                // If max retries reached and still no unbanned cat
                setError("Could not find an unbanned cat after multiple attempts. Try removing some items from the ban list.");
                setCurrentCat(null); // Clear displayed cat if none found
            }

        } catch (e) {
            console.error("Error fetching cat:", e);
            setError(`Failed to fetch cat: ${e.message}. Please check your API key or network connection.`);
            setCurrentCat(null); // Clear displayed cat on error
        } finally {
            setIsLoading(false); // Set loading to false regardless of success or failure
        }
    };

    // Helper function to check if a cat has any banned attributes
    const isCatBanned = (cat, currentBanList) => {
        if (!cat || !cat.breeds || cat.breeds.length === 0) {
            // If cat data is incomplete, assume not banned for simplicity or handle as needed
            return false;
        }

        const breed = cat.breeds[0]; // Assuming one primary breed for simplicity

        // Define the attributes we are checking against the ban list
        const attributesToCheck = [
            { type: 'breedName', value: breed.name },
            { type: 'temperament', value: breed.temperament }, // Temperament can be a comma-separated string
            { type: 'origin', value: breed.origin }
        ].filter(attr => attr.value); // Filter out attributes that might be null/undefined

        for (const bannedItem of currentBanList) {
            for (const catAttribute of attributesToCheck) {
                // For temperament, check if any part of the temperament string matches
                if (catAttribute.type === 'temperament' && bannedItem.type === 'temperament') {
                    if (catAttribute.value.split(', ').includes(bannedItem.value)) {
                        return true;
                    }
                } else if (catAttribute.type === bannedItem.type && catAttribute.value === bannedItem.value) {
                    return true;
                }
            }
        }
        return false;
    };

    // Effect to fetch a cat when the component mounts
    useEffect(() => {
        fetchCat();
    }, []); // Empty dependency array means this runs once on mount

    // Function to handle clicking on an attribute value
    const handleAttributeClick = (type, value) => {
        setBanList(prevBanList => {
            const exists = prevBanList.some(item => item.type === type && item.value === value);
            if (exists) {
                // If attribute is already in ban list, remove it
                return prevBanList.filter(item => !(item.type === type && item.value === value));
            } else {
                // If attribute is not in ban list, add it
                return [...prevBanList, { type, value }];
            }
        });
    };

    // Function to render a clickable attribute
    const renderClickableAttribute = (type, label, value) => {
        if (!value) return null; // Don't render if value is empty

        const isBanned = banList.some(item => item.type === type && item.value === value);
        const banStyle = isBanned ? 'bg-red-500 text-white line-through' : 'bg-blue-500 hover:bg-blue-600 text-white';

        return (
            <p className="mb-2">
                <span className="font-semibold">{label}: </span>
                <span
                    className={`inline-block px-3 py-1 rounded-full cursor-pointer transition-all duration-200 ${banStyle}`}
                    onClick={() => handleAttributeClick(type, value)}
                    title={isBanned ? 'Click to unban' : 'Click to ban'}
                >
                    {value}
                </span>
            </p>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-200 flex flex-col lg:flex-row items-start lg:items-center justify-center p-4 font-inter text-gray-800 space-y-8 lg:space-y-0 lg:space-x-8">
            {/* Main Content Area */}
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full lg:w-1/2 xl:w-2/5 text-center flex-shrink-0">
                <h1 className="text-4xl font-bold text-purple-700 mb-6">Veni Vici!</h1>

                <button
                    onClick={() => fetchCat()}
                    className="w-full bg-indigo-600 text-white py-3 px-6 rounded-xl shadow-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300 mb-8"
                    disabled={isLoading}
                >
                    {isLoading ? 'Discovering...' : 'Discover New Cat!'}
                </button>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mb-4" role="alert">
                        <strong className="font-bold">Error!</strong>
                        <span className="block sm:inline"> {error}</span>
                    </div>
                )}

                {isLoading && (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
                    </div>
                )}

                {!isLoading && currentCat && (
                    <div className="mb-8">
                        <img
                            src={currentCat.url}
                            alt={currentCat.breeds[0]?.name || 'A cat'}
                            className="w-full h-64 object-cover rounded-xl mb-4 shadow-md"
                            onError={(e) => {
                                e.target.onerror = null; // Prevent infinite loop
                                e.target.src = "https://placehold.co/600x400/cccccc/333333?text=Image+Not+Found";
                            }}
                        />
                        <div className="text-left">
                            {renderClickableAttribute('breedName', 'Breed', currentCat.breeds[0]?.name)}
                            {renderClickableAttribute('temperament', 'Temperament', currentCat.breeds[0]?.temperament)}
                            {renderClickableAttribute('origin', 'Origin', currentCat.breeds[0]?.origin)}
                        </div>
                    </div>
                )}

                {!isLoading && !currentCat && !error && (
                    <p className="text-gray-600">Click "Discover New Cat!" to find your first feline friend!</p>
                )}
            </div>

            {/* Ban List Area */}
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full lg:w-1/3 xl:w-1/4 text-left flex-shrink-0">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Ban List</h2>
                {banList.length === 0 ? (
                    <p className="text-gray-500">No attributes banned yet. Click on an attribute on the left to add it!</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {banList.map((item, index) => (
                            <span
                                key={`${item.type}-${item.value}-${index}`} // Unique key
                                className="bg-red-200 text-red-800 px-3 py-1 rounded-full cursor-pointer transition-all duration-200 hover:bg-red-300"
                                onClick={() => handleAttributeClick(item.type, item.value)}
                                title="Click to unban"
                            >
                                {item.type}: {item.value} &times;
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
