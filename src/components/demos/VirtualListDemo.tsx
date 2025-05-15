import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Divider, TextField, Button } from '@mui/material';
import { VirtualList } from '../../utils/virtualizer';
import { globalCache } from '../../utils/performance';

// Generate a large dataset for demonstration
const generateItems = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    title: `Item ${index}`,
    description: `This is a description for item ${index}. It contains some text to demonstrate how virtualization works.`,
    timestamp: new Date(Date.now() - Math.random() * 10000000000).toISOString()
  }));
};

const VirtualListDemo: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemCount, setItemCount] = useState(10000);
  const [inputValue, setInputValue] = useState('10000');

  // Simulate loading data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      // Try to get from cache first
      const cachedItems = globalCache.get<any[]>(`demo_items_${itemCount}`);
      if (cachedItems) {
        setItems(cachedItems);
        setLoading(false);
        return;
      }
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate items
      const newItems = generateItems(itemCount);
      
      // Cache the result
      globalCache.set(`demo_items_${itemCount}`, newItems);
      
      setItems(newItems);
      setLoading(false);
    };
    
    loadData();
  }, [itemCount]);

  const handleItemCountChange = () => {
    const count = parseInt(inputValue, 10);
    if (count > 0 && count <= 100000) {
      setItemCount(count);
    } else {
      alert('Please enter a valid number between 1 and 100,000');
    }
  };

  // Render individual item
  const renderItem = (item: any, index: number) => (
    <Paper 
      elevation={1}
      sx={{ 
        p: 2,
        m: 1,
        backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#ffffff',
        transition: 'background-color 0.2s',
        '&:hover': {
          backgroundColor: '#f0f5ff',
        }
      }}
    >
      <Typography variant="subtitle1" fontWeight="bold">{item.title}</Typography>
      <Typography variant="body2" color="text.secondary">{item.description}</Typography>
      <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
        {new Date(item.timestamp).toLocaleString()}
      </Typography>
    </Paper>
  );

  return (
    <Box sx={{ maxWidth: '100%', height: '100vh', padding: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>Virtual List Demo</Typography>
        <Typography variant="body1" paragraph>
          This demo renders {itemCount.toLocaleString()} items using virtualization, 
          so only visible items are actually in the DOM. Try scrolling quickly to see 
          the performance difference compared to traditional rendering.
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TextField
            label="Number of items"
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            size="small"
            sx={{ mr: 2, width: 150 }}
          />
          <Button 
            variant="contained" 
            onClick={handleItemCountChange}
            disabled={loading}
          >
            Update List
          </Button>
        </Box>
        
        <Typography variant="caption" color="text.secondary">
          Note: Each item is approximately 50px tall, meaning this list would normally 
          create {(itemCount * 50 / 1000).toFixed(1)}KB worth of DOM height.
        </Typography>
      </Paper>
      
      <Divider sx={{ my: 2 }} />
      
      <Paper 
        elevation={2} 
        sx={{ 
          height: 'calc(100vh - 260px)', 
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: '100%'
          }}>
            <CircularProgress size={40} />
            <Typography sx={{ ml: 2 }}>Loading {itemCount.toLocaleString()} items...</Typography>
          </Box>
        ) : (
          <VirtualList
            items={items}
            height="100%"
            width="100%"
            itemHeight={80} // Approximate height of each item
            renderItem={renderItem}
            overscan={5} // Number of items to render outside of viewport
          />
        )}
      </Paper>
    </Box>
  );
};

export default VirtualListDemo; 