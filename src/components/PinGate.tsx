import React, { useState, useRef, useEffect, FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { pinService } from '../services/pinService';

interface PinGateProps {
    onAuthenticated: () => void;
}

const PinGate: FC<PinGateProps> = ({ onAuthenticated }) => {
    const [pin, setPin] = useState<string[]>(['', '', '', '']);
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showPin, setShowPin] = useState<boolean>(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Focus first input on mount
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    // Handle input change
    const handleInputChange = (index: number, value: string) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) {
            return;
        }

        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);
        setError('');

        // Auto-focus next input
        if (value && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all 4 digits are entered
        if (value && index === 3) {
            const fullPin = newPin.join('');
            if (fullPin.length === 4) {
                handleSubmit(fullPin);
            }
        }
    };

    // Handle backspace
    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    // Handle paste
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 4);
        if (/^\d{4}$/.test(pastedData)) {
            const newPin = pastedData.split('');
            setPin(newPin);
            setError('');
            // Focus last input
            inputRefs.current[3]?.focus();
            // Auto-submit
            handleSubmit(pastedData);
        }
    };

    // Handle submit
    const handleSubmit = async (pinValue?: string) => {
        const pinToValidate = pinValue || pin.join('');

        if (pinToValidate.length !== 4) {
            setError('Please enter a 4-digit PIN');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const result = await pinService.validatePin(pinToValidate);

            if (result.success) {
                // Success - trigger authentication callback
                onAuthenticated();
            } else {
                setError(result.message);
                // Clear PIN and reset focus
                setPin(['', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } catch (err: any) {
            setError(err.message || 'Failed to validate PIN. Please try again.');
            setPin(['', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center p-4 min-h-screen bg-gradient-to-br via-purple-900 from-slate-900 to-slate-900">
            {/* Animated Background */}
            <div className="overflow-hidden absolute inset-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse bg-blue-500/20"></div>
                <div className="absolute right-1/4 bottom-1/4 w-96 h-96 rounded-full blur-3xl delay-1000 animate-pulse bg-purple-500/20"></div>
            </div>

            {/* PIN Entry Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-md"
            >
                <div className="p-8 rounded-2xl border shadow-2xl backdrop-blur-md bg-white/10 border-white/20">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mb-8 text-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                            className="flex justify-center mb-4"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-50 blur-xl"></div>
                                <div className="flex relative justify-center items-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg">
                                    <Lock className="w-10 h-10 text-white" />
                                </div>
                            </div>
                        </motion.div>
                        <h1 className="mb-2 text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-200">
                            Access Required
                        </h1>
                        <p className="text-sm text-white/70">
                            Enter your 4-digit PIN to continue
                        </p>
                    </motion.div>

                    {/* PIN Input Fields */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="mb-6"
                    >
                        <div className="flex gap-3 justify-center items-center">
                            {pin.map((digit, index) => (
                                <motion.input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type={showPin ? "text" : "password"}
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleInputChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={index === 0 ? handlePaste : undefined}
                                    disabled={isLoading}
                                    className={`
                    w-16 h-16 text-center text-2xl font-bold rounded-xl
                    border-2 transition-all duration-300
                    ${error
                                            ? 'text-red-400 border-red-500 bg-red-500/10'
                                            : digit
                                                ? 'text-white border-blue-500 bg-blue-500/20'
                                                : 'border-white/30 bg-white/5 text-white/50'
                                        }
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    disabled:opacity-50 disabled:cursor-not-allowed
                    backdrop-blur-sm
                  `}
                                    whileFocus={{ scale: 1.05 }}
                                />
                            ))}
                            {/* Eye Icon Toggle */}
                            <motion.button
                                type="button"
                                onClick={() => setShowPin(!showPin)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="flex justify-center items-center w-12 h-12 rounded-xl border-2 backdrop-blur-sm transition-all duration-300 border-white/30 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/50"
                                aria-label={showPin ? "Hide PIN" : "Show PIN"}
                            >
                                {showPin ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* Error Message */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex gap-2 justify-center items-center p-3 mb-4 rounded-lg border bg-red-500/10 border-red-500/30"
                            >
                                <AlertCircle className="w-5 h-5 text-red-400" />
                                <span className="text-sm font-medium text-red-400">{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Loading Indicator */}
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-center items-center mb-4"
                        >
                            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                        </motion.div>
                    )}

                    {/* Submit Button (Optional - for manual submission) */}
                    <motion.button
                        onClick={() => handleSubmit()}
                        disabled={isLoading || pin.join('').length !== 4}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
              w-full py-3 px-6 rounded-xl font-semibold text-white
              bg-gradient-to-r from-blue-500 to-purple-600
              shadow-lg transition-all duration-300
              ${isLoading || pin.join('').length !== 4
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:shadow-xl hover:from-blue-600 hover:to-purple-700'
                            }
            `}
                    >
                        {isLoading ? 'Validating...' : 'Enter'}
                    </motion.button>

                    {/* Footer */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-6 text-xs text-center text-white/50"
                    >
                        Secure access to the attendance system
                    </motion.p>
                </div>
            </motion.div>
        </div>
    );
};

export default PinGate;

