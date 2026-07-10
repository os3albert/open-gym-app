import { isValidYouTubeUrl, parseYouTubeVideoId, youtubeWatchUrl } from '../../src/services/youtube'

describe('parseYouTubeVideoId', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtube.com/watch?v=dQw4w9WgXcQ&t=42s', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://m.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/live/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['  https://youtu.be/dQw4w9WgXcQ  ', 'dQw4w9WgXcQ'],
  ])("estrae l'id da %s", (url, expected) => {
    expect(parseYouTubeVideoId(url)).toBe(expected)
  })

  it.each([
    ['https://vimeo.com/12345'],
    ['https://www.youtube.com/watch'],
    ['https://www.youtube.com/watch?v=troppo-corto'],
    ['https://youtu.be/'],
    ['ftp://youtu.be/dQw4w9WgXcQ'],
    ['non è un url'],
    [''],
    ['https://falso-youtube.com/watch?v=dQw4w9WgXcQ'],
  ])('rifiuta %s', (url) => {
    expect(parseYouTubeVideoId(url)).toBeNull()
    expect(isValidYouTubeUrl(url)).toBe(false)
  })
})

describe('youtubeWatchUrl', () => {
  it('costruisce il link watch canonico', () => {
    expect(youtubeWatchUrl('dQw4w9WgXcQ')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  })
})
