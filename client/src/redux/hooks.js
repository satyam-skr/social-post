import { useDispatch, useSelector } from 'react-redux';

// Hook to use dispatch function
export const useAppDispatch = () => useDispatch();

// Hook to use selector (typed for better development experience)
export const useAppSelector = useSelector;

export default {
  useAppDispatch,
  useAppSelector,
};
