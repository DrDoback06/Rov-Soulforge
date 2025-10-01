import { useEffect } from 'react';
import { router } from 'expo-router';

/**
 * Shop Tab - Redirects to shop/index
 */
export default function ShopTab() {
  useEffect(() => {
    router.replace('/shop');
  }, []);

  return null;
}
