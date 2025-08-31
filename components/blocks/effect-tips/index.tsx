export function EffectTips() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6">
          Tips for Best Results
        </h2>
        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Image Quality
              </h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Use high-resolution images (min 512x512px)</li>
                <li>• Ensure good lighting and clear subjects</li>
                <li>• Avoid blurry or low-quality source images</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Effect Optimization
              </h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Experiment with different settings</li>
                <li>• Consider the subject matter for best effect</li>
                <li>• Try multiple variations for comparison</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}