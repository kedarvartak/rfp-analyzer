import { useState } from 'react';
import { uploadFile, queryDocument } from './api';

import HeroSection from './components/landing';

export default function App() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isUploaded, setIsUploaded] = useState(false);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      
      try {
        setLoading(true);
        await uploadFile(selectedFile);
        setIsUploaded(true);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isUploaded) {
      setError('Please upload a document first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await queryDocument(query);
      setResults(result.answer);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <HeroSection />
  );
}