import React, { useState, useEffect } from 'react';
import CodeBlock from '@theme/CodeBlock';

export default function GithubCode({ user, repo, branch = 'main', path, language = 'java' }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetches the raw file content from GitHub
    const fetchCode = async () => {
      try {
        const rawUrl = `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${path}`;
        const response = await fetch(rawUrl);
        
        if (!response.ok) {
          throw new Error('Código no encontrado en la ruta especificada.');
        }
        
        const text = await response.text();
        setCode(text);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCode();
  }, [user, repo, branch, path]);

  // Loading state (typically milliseconds)
  if (loading) {
    return <div><em>Loading code from GitHub...</em></div>;
  }

  // Error state (wrong path or network failure)
  if (error) {
    return <div style={{ color: 'red', border: '1px solid red', padding: '10px' }}>Error: {error}</div>;
  }

  const githubUrl = `https://github.com/${user}/${repo}/blob/${branch}/${path}`;

  // Final render using Docusaurus CodeBlock
  return (
    <div>
      <CodeBlock language={language} title={path}>
        {code}
      </CodeBlock>
      <div style={{ textAlign: 'right', marginTop: '-0.75rem', marginBottom: '1rem' }}>
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '0.8rem', opacity: 0.7 }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ verticalAlign: 'middle', marginRight: '4px', marginBottom: '2px' }}
          >
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577v-2.165c-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.835 2.809 1.305 3.495.998.108-.775.418-1.305.762-1.605-2.665-.3-5.467-1.332-5.467-5.93 0-1.31.468-2.382 1.235-3.22-.123-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.047.138 3.003.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.12 3.176.77.838 1.233 1.91 1.233 3.22 0 4.61-2.807 5.625-5.48 5.92.43.372.823 1.102.823 2.222v3.293c0 .322.218.694.825.576C20.565 21.796 24 17.298 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          {githubUrl}
        </a>
      </div>
    </div>
  );
}