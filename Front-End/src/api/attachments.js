export const imageTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif']

export async function readAttachments(files, current = []) {
  const selected = Array.from(files).filter((file) => file.name)
  if (current.length + selected.length > 10) throw new Error('Selecione até 10 arquivos por projeto.')
  if (selected.some((file) => file.size === 0)) throw new Error('Selecione arquivos com conteúdo.')
  const existingSize = current.reduce((sum, file) => sum + file.dados.length * 3 / 4 - (file.dados.match(/=+$/)?.[0].length ?? 0), 0)
  if (selected.reduce((sum, file) => sum + file.size, existingSize) > 4 * 1024 * 1024) {
    throw new Error('Os arquivos podem somar até 4 MB por projeto.')
  }

  return Promise.all(selected.map((file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve({
      nome: file.name,
      tipo: file.type || 'application/octet-stream',
      dados: reader.result.split(',')[1],
    })
    reader.onerror = () => reject(new Error('Não foi possível ler ' + file.name + '.'))
    reader.readAsDataURL(file)
  })))
}
