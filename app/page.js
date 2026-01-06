export default async function Home() {
    let sagas = (await fetch('https://api.api-onepiece.com/v2/sagas/fr')).json()
    console.log(await sagas)
    return (
        <div>Page d'accueil</div>
    );
}
