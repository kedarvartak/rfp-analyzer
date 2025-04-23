import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
});

export const uploadFile = async (file) => {
  console.log('[Frontend] Uploading file:', file.name);  // Debug log
  
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('[Frontend] Upload response:', response.data);  // Debug log
    return response.data;
  } catch (error) {
    console.error('[Frontend] Upload error:', error);
    throw error;
  }
};

export const queryDocument = async (question) => {
  console.log('[Frontend] Sending query:', question);  // Debug log
  
  const formData = new FormData();
  formData.append('question', question);
  
  try {
    const response = await api.post('/query', formData);
    console.log('[Frontend] Query raw response:', response);  // Debug log
    console.log('[Frontend] Query response data:', response.data);  // Debug log
    return response.data;
  } catch (error) {
    console.error('[Frontend] Query error:', error);
    throw error;
  }
};