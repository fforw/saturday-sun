export function createAudioPlayer(muted = false)
{
    const song = document.createElement("audio");
    song.setAttribute("src", "media/nick-drake-saturday-sun.mp3")
    song.setAttribute("controls", "controls")
    song.setAttribute("autoplay", "autoplay")
    song.muted = muted;
    document.getElementById("controls").appendChild(song);

    return song;
}
