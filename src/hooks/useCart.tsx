import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart]
      const productExists = updatedCart.find(product => product.id === productId)

      const response = await api.get(`/stock/${productId}`)

      const newAmount = productExists ? productExists.amount + 1 : 1
        
      if(newAmount > response.data.amount) {
        toast.error('Quantidade solicitada fora de estoque')
        return;
      } 

      if(productExists) {
        productExists.amount = newAmount
      } else {
        const response = await api.get(`/products/${productId}`)
        const newItemCart = {...response.data, amount: 1 }

        updatedCart.push(newItemCart)
      }
      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart]
      const productIndex = updatedCart.findIndex(product => product.id === productId)

      if(productIndex >= 0) {
        updatedCart.splice(productIndex, 1)

        setCart(updatedCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      } else {
        throw Error()
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    if(amount < 1) return
    
    try {
      const updatedCart = [...cart]
      const productExists = updatedCart.find(product => product.id === productId)
      const response = await api.get(`/stock/${productId}`)

      if(!productExists) return;

      if(response.data.amount >= amount) {
        productExists.amount = amount

        setCart(updatedCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      } else {
        toast.error('Quantidade solicitada fora de estoque')
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
