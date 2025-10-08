import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Activity,
    CheckCircle,
    XCircle,
    Clock,
    Server,
    Zap,
    RefreshCw,
    AlertTriangle
} from 'lucide-react';

interface HealthData {
    success: boolean;
    message: string;
    timestamp: string;
    uptime: number;
    environment: string;
}

const Health: React.FC = () => {
    const [healthData, setHealthData] = useState<HealthData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastChecked, setLastChecked] = useState<Date | null>(null);

    const checkHealth = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('http://mca-alb-1160937752.us-east-1.elb.amazonaws.com/api/health');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: HealthData = await response.json();
            setHealthData(data);
            setLastChecked(new Date());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to check health status');
            setHealthData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkHealth();

        // Auto-refresh every 30 seconds
        const interval = setInterval(checkHealth, 30000);

        return () => clearInterval(interval);
    }, []);

    const formatUptime = (uptime: number) => {
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    };

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-200 mb-2">
                                System Health
                            </h1>
                            <p className="text-gray-300">
                                Monitor server status and performance metrics
                            </p>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={checkHealth}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                            {loading ? 'Checking...' : 'Refresh'}
                        </motion.button>
                    </div>
                </motion.div>

                {/* Health Status Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
                >
                    {/* Main Status */}
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-white">Server Status</h2>
                            {healthData ? (
                                healthData.success ? (
                                    <CheckCircle className="w-8 h-8 text-green-400" />
                                ) : (
                                    <XCircle className="w-8 h-8 text-red-400" />
                                )
                            ) : (
                                <AlertTriangle className="w-8 h-8 text-yellow-400" />
                            )}
                        </div>

                        {loading ? (
                            <div className="flex items-center gap-3 text-gray-300">
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                <span>Checking health status...</span>
                            </div>
                        ) : error ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-red-400">
                                    <XCircle className="w-5 h-5" />
                                    <span className="font-semibold">Connection Failed</span>
                                </div>
                                <p className="text-gray-300 text-sm">{error}</p>
                            </div>
                        ) : healthData ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-green-400">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="font-semibold">{healthData.message}</span>
                                </div>
                                <div className="text-gray-300 text-sm">
                                    <p>Environment: <span className="text-blue-400 font-medium">{healthData.environment}</span></p>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* Last Checked */}
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <Clock className="w-6 h-6 text-blue-400" />
                            <h2 className="text-xl font-semibold text-white">Last Checked</h2>
                        </div>

                        {lastChecked ? (
                            <div className="space-y-2">
                                <p className="text-gray-300">
                                    <span className="text-blue-400 font-medium">
                                        {lastChecked.toLocaleTimeString()}
                                    </span>
                                </p>
                                <p className="text-gray-400 text-sm">
                                    {lastChecked.toLocaleDateString()}
                                </p>
                            </div>
                        ) : (
                            <p className="text-gray-400">Not checked yet</p>
                        )}
                    </div>
                </motion.div>

                {/* Detailed Metrics */}
                {healthData && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {/* Uptime */}
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-2xl">
                            <div className="flex items-center gap-3 mb-4">
                                <Server className="w-6 h-6 text-green-400" />
                                <h3 className="text-lg font-semibold text-white">Uptime</h3>
                            </div>
                            <p className="text-2xl font-bold text-green-400 mb-2">
                                {formatUptime(healthData.uptime)}
                            </p>
                            <p className="text-gray-400 text-sm">
                                Server running since last restart
                            </p>
                        </div>

                        {/* Environment */}
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-2xl">
                            <div className="flex items-center gap-3 mb-4">
                                <Zap className="w-6 h-6 text-blue-400" />
                                <h3 className="text-lg font-semibold text-white">Environment</h3>
                            </div>
                            <p className="text-2xl font-bold text-blue-400 mb-2 capitalize">
                                {healthData.environment}
                            </p>
                            <p className="text-gray-400 text-sm">
                                Current deployment environment
                            </p>
                        </div>

                        {/* Timestamp */}
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-2xl">
                            <div className="flex items-center gap-3 mb-4">
                                <Activity className="w-6 h-6 text-purple-400" />
                                <h3 className="text-lg font-semibold text-white">Last Response</h3>
                            </div>
                            <p className="text-sm font-medium text-purple-400 mb-2">
                                {formatTimestamp(healthData.timestamp)}
                            </p>
                            <p className="text-gray-400 text-sm">
                                Server response timestamp
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* Auto-refresh indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-8 text-center"
                >
                    <p className="text-gray-400 text-sm">
                        Auto-refreshing every 30 seconds
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default Health;
