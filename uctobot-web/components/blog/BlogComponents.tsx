interface HighlightBoxProps {
  title: string;
  children: React.ReactNode;
  type?: 'info' | 'warning' | 'success' | 'tip';
}

export function HighlightBox({ title, children, type = 'info' }: HighlightBoxProps) {
  const getStyles = () => {
    switch (type) {
      case 'warning':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          icon: '⚠️',
          accent: 'text-amber-700'
        };
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: '✅',
          accent: 'text-green-700'
        };
      case 'tip':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: '💡',
          accent: 'text-blue-700'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          icon: 'ℹ️',
          accent: 'text-gray-700'
        };
    }
  };

  const styles = getStyles();

  return (
    <div className={`my-6 p-6 rounded-lg border-2 ${styles.bg} ${styles.border}`}>
      <div className={`flex items-center gap-2 mb-3 font-semibold ${styles.accent}`}>
        <span className="text-lg">{styles.icon}</span>
        <h4 className="text-lg">{title}</h4>
      </div>
      <div className="prose prose-sm max-w-none">
        {children}
      </div>
    </div>
  );
}

interface CalculatorBoxProps {
  title: string;
  children: React.ReactNode;
}

export function CalculatorBox({ title, children }: CalculatorBoxProps) {
  return (
    <div className="my-8 p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xl">🧮</span>
        </div>
        <h4 className="text-xl font-bold text-green-800">{title}</h4>
      </div>
      <div className="prose max-w-none">
        {children}
      </div>
    </div>
  );
}

interface StepsListProps {
  title: string;
  steps: string[];
}

export function StepsList({ title, steps }: StepsListProps) {
  return (
    <div className="my-8 p-6 bg-white rounded-xl border shadow-sm">
      <h4 className="text-xl font-bold mb-6 flex items-center gap-2">
        <span className="text-2xl">📋</span>
        {title}
      </h4>
      <ol className="space-y-4">
        {steps.map((step, index) => (
          <li key={index} className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
              {index + 1}
            </div>
            <div className="flex-1 pt-1">
              <p className="text-gray-700">{step}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

interface ComparisonTableProps {
  title: string;
  headers: string[];
  rows: Array<{ label: string; values: string[] }>;
}

export function ComparisonTable({ title, headers, rows }: ComparisonTableProps) {
  return (
    <div className="my-8">
      <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span className="text-2xl">📊</span>
        {title}
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white rounded-lg shadow-sm overflow-hidden">
          <thead>
            <tr className="bg-gradient-to-r from-green-500 to-green-600">
              {headers.map((header, index) => (
                <th key={index} className="px-4 py-3 text-left font-semibold text-white">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="px-4 py-3 font-semibold text-gray-900">{row.label}</td>
                {row.values.map((value, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3 text-gray-700">
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}