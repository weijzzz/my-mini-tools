import { getAllStorageData, restoreAllStorageData } from './storage';

export function exportBackup() {
  const data = getAllStorageData();
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const filename = `账单备份_${timestamp}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

export function importBackup(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('未选择文件'));
      return;
    }

    if (!file.name.endsWith('.json')) {
      reject(new Error('请选择 JSON 格式的备份文件'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);

        if (typeof data !== 'object' || data === null) {
          reject(new Error('备份文件格式无效'));
          return;
        }

        restoreAllStorageData(data);
        resolve({ success: true, message: '数据恢复成功' });
      } catch (err) {
        reject(new Error('备份文件解析失败：' + err.message));
      }
    };

    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };

    reader.readAsText(file);
  });
}
