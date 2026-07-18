import React, { useState } from 'react';

function App() {
  // --- Memory State for Uploads ---
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  // --- Memory State for Search Filters ---
  const [query, setQuery] = useState("");
  const [minExperience, setMinExperience] = useState(0);
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState("");
  
  // --- Memory State for Search Results ---
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // --- File Selection Handler ---
  const handleFileChange = (e) => {
    setSelectedFiles(e.target.files); // Save files to state
    setUploadMessage(""); 
  };

  // --- Send Files to Backend (/upload) ---
  const handleUploadSubmit = async (e) => {
    e.preventDefault(); // Stop page reload
    if (selectedFiles.length === 0) {
      alert("Please select at least one PDF resume file to upload first!");
      return;
    }

    setUploadLoading(true);
    setUploadMessage("");

    // Package files into multi-part form data
    const formData = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append("files", selectedFiles[i]);
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      setUploadMessage(`✅ Success! Uploaded: ${data.files.join(", ")}`);
      setSelectedFiles([]); // Clear file picker
    } catch (error) {
      console.error(error);
      setUploadMessage(" Upload failed. Make sure FastAPI server is running.");
    } finally {
      setUploadLoading(false);
    }
  };

  // --- Send Filters & Query to Backend (/search) ---
  const handleSearchSubmit = async (e) => {
    e.preventDefault(); // Stop page reload
    setSearchLoading(true);

    // Convert comma text into a clean string array
    const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s);

    // Group inputs into the JSON payload dictionary
    const searchPayload = {
      query: query,
      min_experience: parseInt(minExperience) || 0,
      location: location,
      skills: skillsArray.length > 0 ? skillsArray : [""]
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchPayload),
      });

      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setSearchResults(data); // Save matches to results array
    } catch (error) {
      console.error(error);
      alert("Failed to connect to FastAPI search endpoint.");
    } finally {
      setSearchLoading(false);
    }
  };

  // --- UI Layout Design ---
  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', maxWidth: '750px', margin: '0 auto', color: '#fff', backgroundColor: '#121212', minHeight: '100vh' }}>
      
      <h1 style={{ textAlign: 'center', margin: '0' }}> AI Recruiter Dashboard</h1>
      <p style={{ textAlign: 'center', color: '#aaa', marginTop: '20px' }}>Resume Search</p>
      
      {/* 📁 PART 1: UPLOAD BOX */}
      <div style={{ padding: '20px', border: '1px solid #1e1e3f', borderRadius: '8px', backgroundColor: '#1e1e1e', marginTop: '25px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#007bff' }}>📁 1: Upload New Candidate Resumes</h3>
        <p style={{ color: '#aaa', fontSize: '13px', margin: '0 0 15px 0' }}>Select one or multiple PDF resumes </p>
        
        <form onSubmit={handleUploadSubmit} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <input 
            type="file" 
            multiple 
            accept=".pdf" 
            onChange={handleFileChange}
            style={{ color: '#fcf7f7', fontSize: '14px' }}
          />
          <button 
            type="submit" 
            disabled={uploadLoading}
            style={{ padding: '10px 20px', background: '#23af81', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {uploadLoading ? "Processing Pipeline..." : "Submit"}
          </button>
        </form>
        
        {uploadMessage && (
          <p style={{ marginTop: '12px', fontSize: '14px', fontWeight: 'bold', color: uploadMessage.includes('✅') ? '#28a745' : '#dc3545', margin: '10px 0 0 0' }}>
            {uploadMessage}
          </p>
        )}
      </div>

      <hr style={{ borderColor: '#222', margin: '30px 0' }} />

      {/* 🔍 PART 2: SEARCH FILTERS BOX */}
      <div style={{ padding: '20px', border: '1px solid #333', borderRadius: '8px', backgroundColor: '#1e1e1e' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#007bff' }}> 2: Semantic Talent Discovery</h3>
        
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ fontWeight: 'bold', color: '#e0e0e0', fontSize: '14px' }}>Query:</label>
            <input 
              type="text" 
              placeholder="e.g., Cloud architect with kubernetes or python developer" 
              value={query} 
              onChange={(e) => setQuery(e.target.value)}
              style={{ width: '100%', padding: '12px', marginTop: '5px', borderRadius: '4px', border: '1px solid #928f8f', backgroundColor: '#121212', color: '#fff', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 'bold', color: '#e0e0e0', fontSize: '14px' }}>Minimum Experience (Years):</label>
              <input 
                type="number" 
                min="0" // Restricts input to zero and positive numbers
                value={minExperience} 
                onChange={(e) => setMinExperience(e.target.value)}
                style={{ width: '100%', padding: '12px', marginTop: '5px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#121212', color: '#fff', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 'bold', color: '#e0e0e0', fontSize: '14px' }}>Location:</label>
              <input 
                type="text" 
                placeholder="e.g., Ahmedabad" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)}
                style={{ width: '100%', padding: '12px', marginTop: '5px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#121212', color: '#fff', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontWeight: 'bold', color: '#e0e0e0', fontSize: '14px' }}>Skills  (Comma-separated exact keywords):</label>
            <input 
              type="text" 
              placeholder="e.g., docker, fastapi, react" 
              value={skills} 
              onChange={(e) => setSkills(e.target.value)}
              style={{ width: '100%', padding: '12px', marginTop: '5px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#121212', color: '#fff', boxSizing: 'border-box' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={searchLoading}
            style={{ padding: '14px', background: '#0d6d58', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
          >
            {searchLoading ? "Querying Chroma Vector Space..." : "Find Best Matching Candidates"}
          </button>
        </form>
      </div>

      {/* 👤 PART 3: RESULTS LIST */}
      <div style={{ marginTop: '40px' }}>
        <h2 style={{ borderBottom: '1px solid #333', paddingBottom: '10px' }}>Results ({searchResults.length})</h2>
        {searchResults.length === 0 && !searchLoading && <p style={{ color: '#888', fontStyle: 'italic' }}>No resumes fetched yet. Perform a search request query above.</p>}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '15px' }}>
          {searchResults.map((resume, index) => (
            <div key={index} style={{ padding: '20px', border: '1px solid #333', borderRadius: '8px', backgroundColor: '#1e1e1e' }}>
              
              <h3 style={{ margin: '0 0 10px 0', color: '#fff' }}>
                👤 {resume.name ? resume.name.split("Email:")[0].trim() : `Candidate #${index + 1}`}
              </h3>
              
              <p style={{ margin: '5px 0', color: '#ddd', fontSize: '14px' }}>
                <strong>Experience Level:</strong> {resume.experience} Years
              </p>

              {resume.score !== undefined && (
                <p style={{ margin: '5px 0', color: '#ddd', fontSize: '14px' }}>
                  <strong>Matching Score Metric:</strong> <span style={{ color: '#28a745', fontWeight: 'bold' }}>{(resume.score * 100).toFixed(1)}% Match</span>
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
export default App;