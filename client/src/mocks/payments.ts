export interface OrderItem {
  id: string;
  name: string;
  price: number;
}

export interface PaymentDetails {
  amount: number;
  date: string;
  orderItems: OrderItem[];
  total: number;
}

export const paymentDetails: PaymentDetails = {
  amount: 15000,
  date: '04/10/2025',
  orderItems: [
    {
      id: '1',
      name: 'Gold Plan',
      price: 3000,
    },
    {
      id: '2',
      name: 'CGM Device',
      price: 12000,
    },
  ],
  total: 15000,
};
