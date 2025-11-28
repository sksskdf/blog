# BLOG

Link : https://blog-harry.vercel.app/

<img width="1280" alt="스크린샷 2023-05-31 오후 5 17 21" src="https://github.com/sksskdf/BLOG-toyproject/assets/78300703/400e9289-5bf0-4e12-87c5-00064a0ebf09">
<img width="1280" alt="스크린샷 2023-05-31 오후 5 17 31" src="https://github.com/sksskdf/BLOG-toyproject/assets/78300703/a5711661-12f0-4e6c-bf7b-9107bb239612">
<img width="1280" alt="스크린샷 2023-05-31 오후 5 17 34" src="https://github.com/sksskdf/BLOG-toyproject/assets/78300703/88b1025b-ea26-477b-b15e-5fd7a62cf4a3">

-------

### 사용 기술 스택
NextJS
    
------
  
### 기능
#### 블로그 포스트 불러오기
파일시스템의 /posts 경로에 있는 md파일들을 /lib/posts.js 파일에서 읽어 객체로 파싱한 뒤 블로그포스트와 관련된 정보들을 불러오는 함수들을 export 합니다.

#### 메인화면
블로그 주인과 관련된 정보와 export한 /lib/posts.js 파일의 함수를 이용하여 포스트 정보들을 불러온 뒤 
        
        <ul className={utilStyles.list}>
          {allPostsData.map(({ id, date, title }) => (
            <li className={utilStyles.listItem} key={id}>
              <Link href={`/posts/${id}`}>{title}</Link>
              <br />
              <small className={utilStyles.lightText}>
                <Date dateString={date} />
              </small>
            </li>
          ))}
        </ul>
      
위 코드에서 보는 것 처럼 map함수를 이용해서 li를 만듭니다.
li는 해당 포스트 상세보기로 이동하는 Link를 포함합니다.

#### 포스트 상세보기
Next.js 에선 파일시스템의 /pages를 루트로 한 디렉토리 패스가 라우팅 주소와 매칭됩니다.
이를 이용해 /pages/posts/[id].js 파일에서 포스트 상세보기 화면을 구현합니다. (파일내부에서 파일제목인 [id]를 통해 매개변수화된 라우팅주소를 인자로 받습니다.)
해당 id를 통해 포스트정보를 불러온 뒤 

    <Layout>
      <Head>
        <title>{postData.title}</title>
      </Head>
      <article>
        <h1 className={utilStyles.headingXl}>{postData.title}</h1>
        <div className={utilStyles.lightText}>
          <Date dateString={postData.date} />
        </div>
        <br />
        <div dangerouslySetInnerHTML={{ __html: postData.contentHtml }} />
      </article>
    </Layout>

위 코드와 같이 포스트 정보를 출력합니다.

### Next.js 를 사용해 본 소감
내부적으로 React 라이브러리를 포함하고 있어 편리하게 React 컴포넌트를 불러와 사용할 수 있습니다.
대부분의 렌더링 로직이 React에 의존하고 있어 React에 대한 기본적인 지식이 필수적입니다.
또한 리액트를 사용하면서 SSR을 선택적으로 사용할 수 있어 상황에 따라 성능적인 이점도 얻을 수 있겠다는 기대감도 들었습니다.
Next.JS 문서를 살펴보면 유독 Pre-rendering에 대한 두 가지 솔루션의 설명을 상세하게 합니다.
아무래도 Next.js 측에선 이러한 솔루션 제공을 스스로 강점이라 생각하여 강조하는 것 같습니다.
vercel을 이용한 배포도 엄청나게 편리했습니다.
프로젝트를 푸시한 깃헙 리파지토리 주소를 vercel에 넣어주기만하면 앱 빌드부터 배포까지 알아서 다 해줍니다.

다만 프레임워크에서 대부분의 라이프사이클을 제어하기 때문에 다른 프레임워크들에 비해 Customizable 하지 않다는 느낌이 들었습니다.
코드의 구조가 프레임워크 종속적이어서 확장성 또한 떨어진다는 느낌을 받았습니다.

결론은 간단하고 쉽고 빠르게 웹 서비스를 구현하기엔 정말 최적인 프레임워크인 것 같다는 생각이 들었습니다.
기존의 웹 프레임워크 구조에 대한 기본적인 지식만 있으면 이해하기 그리 어려운 구조도 아닐뿐더러,
프론트/백 구분 없이 올인원처럼 빠르게 웹서비스를 구현할 수 있다는 점이 매력적이라고 느꼈습니다.
