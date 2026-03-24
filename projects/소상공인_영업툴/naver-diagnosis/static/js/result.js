// Result page interactions

function downloadPPT(historyId) {
    const btn = document.getElementById('downloadPptBtn');
    const btnText = document.getElementById('downloadBtnText');
    const btnSpinner = document.getElementById('downloadBtnSpinner');

    // Prevent double clicks
    if (btn.disabled) {
        return;
    }

    // Show loading state
    btn.disabled = true;
    btnText.textContent = 'PPT 생성 중...';
    btnSpinner.classList.remove('hidden');

    // Create download link
    const downloadUrl = `/ppt/generate/${historyId}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `네이버_플레이스_진단_${historyId}.pptx`;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Reset button after delay (assume download starts)
    setTimeout(() => {
        btn.disabled = false;
        btnText.textContent = 'PPT 제안서 다운로드';
        btnSpinner.classList.add('hidden');
    }, 2000);
}

// Optional: Add smooth scroll to improvement points on page load
document.addEventListener('DOMContentLoaded', function() {
    // Add any additional page initialization here
    console.log('Result page loaded successfully');
});
