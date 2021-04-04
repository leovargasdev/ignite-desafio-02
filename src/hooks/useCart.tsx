import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

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

  const findProductInCart = (productId: number) => {
    return cart.findIndex(product => product.id === productId)
  }

  const addProduct = async (productId: number) => {
    const query = { params: { id: productId } }
    try {
      const cartAux = [...cart]
      const existProductCart = findProductInCart(productId)

      if(existProductCart >= 0) {
        const newAmountProduct = cartAux[existProductCart].amount + 1
        
        const { data: [productStock] } = await api.get('/stock', query)
        
        if(newAmountProduct > productStock.amount) {
          toast.error('Quantidade solicitada fora de estoque')
        } else {
          cartAux[existProductCart].amount += 1
        }

      // Buscando e adicionando novo produto ao carrinho
      } else {
        const response = await api.get('/products', query)
        const newItemCart = {...response.data[0], amount: 1 }
        cartAux.push(newItemCart)
      }
      setCart(cartAux)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartAux))
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter(product => product.id !== productId)

      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    if(amount < 1) return
    const query = { params: { id: productId } }
    
    try {
      const cartAux = [...cart]
      const productIndex = findProductInCart(productId)
      const { data: [productStock] } = await api.get('/stock', query)

      console.log(productStock, ' productStock')
      console.log(amount, ' amount')
      if(productStock.amount >= amount) {
        cartAux[productIndex].amount = amount

        setCart(cartAux)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartAux))
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
